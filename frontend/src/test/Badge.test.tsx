import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '../components/common/Badge'

describe('Badge Component', () => {
  it('renders badge children correctly', () => {
    render(<Badge variant="success">Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders warning variant', () => {
    render(<Badge variant="warning">80% Threshold</Badge>)
    expect(screen.getByText('80% Threshold')).toBeInTheDocument()
  })
})
