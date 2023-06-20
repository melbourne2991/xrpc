
import { Operation } from "../builder.ts";
import { Type } from "@sinclair/typebox";

// A dummy database of books.
let books = [
  {
    isbn: "978-3-16-148410-0",
    title: "A Brief History of Time",
    author: "Stephen Hawking",
  },
  // ... more books ...
];

// Define the getBook operation.
const getBook = Operation()
  .query("getBook")
  .input(
    Type.Object({
      isbn: Type.String(),
    })
  )
  .output(
    Type.Object({
      isbn: Type.String(),
      title: Type.String(),
      author: Type.String(),
    })
  )
  .impl((_, input) => {
    const book = books.find((book) => book.isbn === input.isbn);
    if (!book) throw new Error("Book not found");
    return book;
  });

// Define the addBook operation.
const addBook = Operation()
  .mutation("addBook")
  .input(
    Type.Object({
      isbn: Type.String(),
      title: Type.String(),
      author: Type.String(),
    })
  )
  .output(
    Type.Object({
      success: Type.Boolean(),
    })
  )
  .impl((_, input) => {
    books.push(input);
    return { success: true };
  });

// Define the operations of this API.
const operations = [getBook, addBook];

import { buildDoc } from '../openapi.ts';

const doc = buildDoc({
  basePath: "/bookstore",
  operations,
  info: {
    title: "Bookstore API",
    version: "1.0.0",
  },
})

console.log(JSON.stringify(doc, null, 2));