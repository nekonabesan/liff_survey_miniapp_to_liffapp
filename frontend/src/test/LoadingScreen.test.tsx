import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoadingScreen from '@/components/LoadingScreen'

describe('LoadingScreen', () => {
  it('renders loading text', () => {
    render(<LoadingScreen />)
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('displays spinner', () => {
    render(<LoadingScreen />)
    const spinner = document.querySelector('.spinner')
    expect(spinner).toBeInTheDocument()
  })

  it('has correct CSS classes', () => {
    render(<LoadingScreen />)
    const loadingDiv = document.querySelector('.loading')
    expect(loadingDiv).toHaveClass('loading')
  })
})
