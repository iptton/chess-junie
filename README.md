# Chess Game

A fully functional chess game implemented in TypeScript with a web-based UI.

## Features

- Complete chess rules implementation
- Interactive UI with piece selection and move highlighting
- Special moves: castling, en passant, pawn promotion
- Check and checkmate detection
- Game state tracking and display
- AI competition mode using Stockfish chess engine
- Responsive design

## How to Play

1. Select a game mode from the dropdown menu:
   - Human vs. Human: Play against another person
   - Human vs. AI: Play against the Stockfish chess engine
2. If playing against AI, select the AI's color (white or black)
3. Click on a piece to select it
4. The possible moves for that piece will be highlighted
5. Click on a highlighted square to move the piece
6. The game will automatically switch turns and update the game state
7. If playing against AI, it will automatically make its move after you
8. If a player is in check, it will be displayed in the status
9. When the game ends (checkmate or stalemate), the result will be displayed
10. Click the "Reset Game" button to start a new game

## Implementation Details

The chess game is implemented with a clean architecture separating the game logic from the UI:

### Core Models

- `Board`: Represents the chess board and handles piece placement and movement
- `MoveValidator`: Validates moves according to chess rules and detects check/checkmate
- `Game`: Manages the game state, player turns, and move history
- `StockfishService`: Integrates the Stockfish chess engine for AI moves

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
- Adjustable AI difficulty levels
- Online multiplayer
- Save/load game functionality
