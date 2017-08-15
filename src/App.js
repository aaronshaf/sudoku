// @flow

import React, { Component } from 'react'
import './App.css'
import { generateSudokuGrid, solveSudokuGrid, finishSudokuGrid } from './utils'
import chunk from 'lodash/chunk'
import type { Grid } from './types'

const BOARD_SIZE = 3

type State = {
  grid: Grid
}

class App extends Component {
  state: State

  constructor() {
    super()
    this.state = {
      grid: generateSudokuGrid(BOARD_SIZE)
    }
  }

  processGrid = () => {
    this.setState(state => {
      return { grid: solveSudokuGrid(state.grid) }
    })
  }

  finishSolvingGrid = () => {
    this.setState(state => {
      return { grid: finishSudokuGrid(state.grid) }
    })
  }

  resetGrid = () => {
    this.setState(state => {
      return { grid: solveSudokuGrid(generateSudokuGrid(BOARD_SIZE)) }
    })
  }

  componentDidMount() {
    this.processGrid()
  }

  render() {
    const rows = chunk(this.state.grid.blocks, BOARD_SIZE).map((row, index) => {
      const blocks = row.map((block, index) => {
        const blockRows = chunk(
          block.cells,
          BOARD_SIZE
        ).map((blockRow, index) => {
          const cells = blockRow.map((cell, index) => {
            return (
              <div
                key={index}
                className="Cell"
                title={JSON.stringify(cell, null, 2)}
              >
                {typeof cell.guess === 'number' &&
                  <span style={{ margin: 'auto' }}>
                    {cell.guess}
                  </span>}
              </div>
            )
          })
          return (
            <div key={index} className="BlockRow">
              {cells}
            </div>
          )
        })
        return (
          <div key={index} className="Block">
            {blockRows}
          </div>
        )
      })
      return (
        <div key={index} className="GridRow">
          {blocks}
        </div>
      )
    })

    return (
      <div className="App">
        <div>
          <button
            disabled={this.state.grid.solved}
            onClick={this.finishSolvingGrid}
          >
            Guess all cells
          </button>
          <button disabled={this.state.grid.solved} onClick={this.processGrid}>
            Guess one cell
          </button>
          <button onClick={this.resetGrid}>Reset</button>
        </div>
        <div className="Grid">
          {rows}
        </div>
      </div>
    )
  }
}

export default App
