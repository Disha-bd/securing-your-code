/*
 * Copyright (c) 2014-2024 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

const OPERATORS: Record<string, { precedence: number, associativity: 'left' | 'right' }> = {
  '+': { precedence: 1, associativity: 'left' },
  '-': { precedence: 1, associativity: 'left' },
  '*': { precedence: 2, associativity: 'left' },
  '/': { precedence: 2, associativity: 'left' }
}

function isNumericToken (token: string): boolean {
  return /^\d+(?:\.\d+)?$/.test(token)
}

export function evaluateSimpleExpression (expression: string): number {
  const sanitized = expression.trim()
  const normalized = sanitized.replace(/\s+/g, '')

  if (!normalized || !/^(?:\d+(?:\.\d+)?|[()+\-*/])+$/u.test(normalized)) {
    throw new Error('Unsupported expression')
  }

  const values: number[] = []
  const stack: string[] = []
  const tokens = normalized.match(/\d+(?:\.\d+)?|[()+\-*/]/g) ?? []

  if (tokens.length === 0 || tokens.join('') !== normalized) {
    throw new Error('Unsupported expression')
  }

  for (const token of tokens) {
    if (isNumericToken(token)) {
      values.push(Number(token))
      continue
    }

    if (token === '(') {
      stack.push(token)
      continue
    }

    if (token === ')') {
      while (stack.length > 0 && stack[stack.length - 1] !== '(') {
        values.push(applyOperator(stack.pop() as string, values.pop() as number, values.pop() as number))
      }
      if (stack.length === 0 || stack.pop() !== '(') {
        throw new Error('Mismatched parentheses')
      }
      continue
    }

    while (stack.length > 0 && stack[stack.length - 1] !== '(' && (
      OPERATORS[stack[stack.length - 1]].precedence > OPERATORS[token].precedence ||
      (OPERATORS[stack[stack.length - 1]].precedence === OPERATORS[token].precedence && OPERATORS[token].associativity === 'left')
    )) {
      values.push(applyOperator(stack.pop() as string, values.pop() as number, values.pop() as number))
    }
    stack.push(token)
  }

  while (stack.length > 0) {
    const operator = stack.pop() as string
    if (operator === '(') {
      throw new Error('Mismatched parentheses')
    }
    values.push(applyOperator(operator, values.pop() as number, values.pop() as number))
  }

  if (values.length !== 1) {
    throw new Error('Invalid expression')
  }

  return values[0]
}

function applyOperator (operator: string, right: number, left: number): number {
  switch (operator) {
    case '+': return left + right
    case '-': return left - right
    case '*': return left * right
    case '/':
      if (right === 0) {
        throw new Error('Division by zero')
      }
      return left / right
    default:
      throw new Error(`Unsupported operator: ${operator}`)
  }
}
