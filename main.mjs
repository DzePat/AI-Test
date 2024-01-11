import OpenAI from "openai";
import * as readline from "readline-sync";

const openai = new OpenAI();
const messages = [];

async function main() {
  messages.push({
    role: "system",
    content: "You are a helpful assistant.",
  });

  while (true) {
    console.debug(messages);
    const userInput = readline.question("ask a question: ");
    if(userInput === "quit")
    {
      break;
    }
    messages.push({
      role: "user",
      content: userInput,
    });

    console.log("myinput: ", userInput);

    const completion = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-4",
    });
    console.debug("openai returns: ", completion);
    console.log("answer: ", completion.choices[0].message);

    messages.push(completion.choices[0].message);
  }
}

main();
