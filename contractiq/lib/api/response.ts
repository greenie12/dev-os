import { NextResponse } from 'next/server'

export function jsonError(error: string, message?: string, status = 400) {
  return NextResponse.json({ error, ...(message ? { message } : {}) }, { status })
}

export function jsonOk<T>(body: T, status = 200) {
  return NextResponse.json(body, { status })
}
