import './style.css'
import './chess/ui/styles.css'
import { ChessBoard } from './chess/ui/ChessBoard'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>Chess Game</h1>
    <div id="chess-container"></div>
    <p class="instructions">
      Click on a piece to select it, then click on a highlighted square to move.
    </p>
  </div>
`

// Initialize the chess board
new ChessBoard('chess-container')
