import '@testing-library/jest-dom'
import { vi } from 'vitest'

// TypeScript型定義の拡張
declare global {
  interface Window {
    liff: any;
  }
  var liff: any;
}

// モックの設定
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// LIFF SDKのモック
const mockLiff = {
  init: vi.fn(),
  isLoggedIn: vi.fn(() => false),
  login: vi.fn(),
  logout: vi.fn(),
  getProfile: vi.fn(() => Promise.resolve({
    userId: 'test-user-id',
    displayName: 'Test User',
    pictureUrl: 'https://example.com/avatar.jpg'
  })),
  isInClient: vi.fn(() => false),
  closeWindow: vi.fn(),
  sendMessages: vi.fn(() => Promise.resolve()),
}

// グローバルオブジェクトに設定
global.liff = mockLiff;

// Windowオブジェクトにliffを追加
Object.defineProperty(window, 'liff', {
  value: mockLiff,
  writable: true
})

// import.meta.envのモック
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_LIFF_ID: 'test-liff-id',
      VITE_API_BASE_URL: 'http://localhost:8000'
    }
  }
})
