# Chess Game

A fully functional chess game implemented in TypeScript with a web-based UI.

## Features

- Complete chess rules implementation
- Interactive UI with piece selection and move highlighting
- Special moves: castling, en passant, pawn promotion
- Check and checkmate detection
- Game state tracking and display
- Responsive design

## How to Play

1. Click on a piece to select it
2. The possible moves for that piece will be highlighted
3. Click on a highlighted square to move the piece
4. The game will automatically switch turns and update the game state
5. If a player is in check, it will be displayed in the status
6. When the game ends (checkmate or stalemate), the result will be displayed
7. Click the "Reset Game" button to start a new game

## Implementation Details

The chess game is implemented with a clean architecture separating the game logic from the UI:

### Core Models

- `Board`: Represents the chess board and handles piece placement and movement
- `MoveValidator`: Validates moves according to chess rules and detects check/checkmate
- `Game`: Manages the game state, player turns, and move history

### UI Components

- `ChessBoard`: Renders the chess board and handles user interactions
- CSS styling for the board, pieces, and game controls

## Development

This project is built with Vite and TypeScript. To run the development server:

```bash
npm install
npm run dev
```

To build for production:

```bash
npm run build
```

## Future Improvements

- Move history display
- Time controls
- AI opponent
- Online multiplayer
- Save/load game functionality