import OpenAI from "openai";
import * as readline from "readline-sync";

const openai = new OpenAI();

const gpt4 = "gpt-4-1106-preview";
const gpt3 = "gpt-3.5-turbo-1106";

const DONE_STATUSES = ["completed", "failed", "expired", "cancelled"];

async function ask(thread, userInput, assistant) {
  const message = await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: userInput,
  });

  let run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistant.id,
    instructions:
      "Please address the user as Jane Doe. The user has a premium account.",
  });

  const pollingInterval = 100;
  const maxTries = 60;

  let messages = await openai.beta.threads.messages.list(thread.id);

  return new Promise(async (resolve, reject) => {
    const retreiver = async (tries) => {
      console.log("poll", tries);
      const previousmessageCount = messages.data.length;
      const retrieved = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log("status: ", retrieved.status);
      messages = await openai.beta.threads.messages.list(thread.id);
      const result = {
        hasNewMessages: previousmessageCount < messages.data.length,
        status: retrieved.status,
        messageArray: messages.data.map((m) => {
          return m.content.map((x) => {
            return x.text;
          });
        }),
      };
      if (DONE_STATUSES.includes(result.status)) {
        resolve(result.messageArray);
      } else if (tries++ >= maxTries) {
        reject("Max tries exceeded");
      } else {
        if (result.hasNewMessages) {
          console.log("We have new messages: ", result.messageArray);
        }
        setTimeout(() => {
          retreiver(tries);
        }, pollingInterval);
      }
    };
    retreiver(0);
  });
}

async function main() {
  const assistant = await openai.beta.assistants.create({
    name: "Math Tutor",
    instructions:
      "You are a personal math tutor. Write and run code to answer math questions.",
    tools: [{ type: "code_interpreter" }],
    model: gpt3,
  });

  const thread = await openai.beta.threads.create();

  while (true) {
    const userInput = readline.question("ask a question: ");
    if (userInput == "") {
      break;
    }
    const messages = await ask(thread, userInput, assistant);
    console.log("done, message count: ", messages.length);
    console.log("messages: ", messages);
  }
}

main();

// return await retreiver(0);
// if (DONE_STATUSES.includes(retrievedData.status)) {
//   resolve(retrievedData.messageArray);
// } else {
//   setTimeout
//   const result = await retreiver(tries);
//   if (result.hasNewMessages) {
//     console.log("messages: ", result.messageArray);
//   }
// }
// const interval = setInterval(async () => {
//   if (DONE_STATUSES.includes(test.status)) {
//     // If the size of the messages array changes, print the result and stop polling
//     console.log("messagesArray: ", messagesArray);
//     const answer = messagesArray[0][0].value;
//     console.log("answer: ", answer);
//     clearInterval(interval);
//     resolve(messagesArray);
//   } else if (previousmessageCount < messages.data.length) {
//     console.log(messagesArray);
//   }
//   if (tries++ >= maxTries) {
//     clearInterval(interval);
//     reject("Max tries exceeded");
//   }
// }, pollingInterval);
// });