declare module 'stockfish' {
  export default function(): Worker;
}

declare module 'stockfish/src/stockfish.wasm' {
  const content: any;
  export default content;
}