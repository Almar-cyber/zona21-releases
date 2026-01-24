import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, log } from './logger';

describe('logger', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  let consoleDebugSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Logger API', () => {
    it('exports helpers', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('does not throw when logging', () => {
      expect(() => log('info', 'test', 'hello')).not.toThrow();
    });
  });

  describe('Log Levels', () => {
    it('should log info messages to console.log', () => {
      logger.info('TestScope', 'Test message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log error messages to console.error', () => {
      logger.error('TestScope', 'Error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log warn messages to console.warn', () => {
      logger.warn('TestScope', 'Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log debug messages to console.debug when level allows', () => {
      // Debug is below info level by default, so it won't be logged
      logger.debug('TestScope', 'Debug message');
      // Since default min level is 'info', debug won't be called
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });

  describe('Log Formatting', () => {
    it('should include timestamp in log output', () => {
      logger.info('TestScope', 'Message');
      const callArgs = consoleLogSpy.mock.calls[0];
      expect(callArgs[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    it('should include log level in output', () => {
      logger.info('TestScope', 'Message');
      const callArgs = consoleLogSpy.mock.calls[0];
      expect(callArgs[0]).toContain('[info]');
    });

    it('should include scope in output', () => {
      logger.info('TestScope', 'Message');
      const callArgs = consoleLogSpy.mock.calls[0];
      expect(callArgs[0]).toContain('[TestScope]');
    });

    it('should include message in output', () => {
      logger.info('TestScope', 'Test message');
      const callArgs = consoleLogSpy.mock.calls[0];
      expect(callArgs[1]).toBe('Test message');
    });
  });

  describe('Data Logging', () => {
    it('should log additional data when provided', () => {
      const data = { key: 'value', count: 42 };
      logger.info('TestScope', 'Message with data', data);
      const callArgs = consoleLogSpy.mock.calls[0];
      expect(callArgs[2]).toEqual(data);
    });

    it('should handle undefined data gracefully', () => {
      logger.info('TestScope', 'Message without data');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle null data', () => {
      logger.info('TestScope', 'Message', null);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle complex objects as data', () => {
      const complexData = {
        nested: { level: 2, value: 'test' },
        array: [1, 2, 3],
        bool: true
      };
      logger.info('TestScope', 'Complex data', complexData);
      const callArgs = consoleLogSpy.mock.calls[0];
      expect(callArgs[2]).toEqual(complexData);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty scope', () => {
      expect(() => logger.info('', 'Message')).not.toThrow();
    });

    it('should handle empty message', () => {
      expect(() => logger.info('Scope', '')).not.toThrow();
    });

    it('should handle special characters in scope', () => {
      expect(() => logger.info('Test:Scope-123', 'Message')).not.toThrow();
    });

    it('should handle special characters in message', () => {
      expect(() => logger.info('Scope', 'Message with "quotes" and \'apostrophes\'')).not.toThrow();
    });

    it('should handle very long messages', () => {
      const longMessage = 'a'.repeat(10000);
      expect(() => logger.info('Scope', longMessage)).not.toThrow();
    });
  });

  describe('All Log Levels', () => {
    it('should call appropriate console methods for each level that passes min level', () => {
      // Debug won't be called since min level is 'info' by default
      logger.debug('Scope', 'Debug');
      logger.info('Scope', 'Info');
      logger.warn('Scope', 'Warn');
      logger.error('Scope', 'Error');

      // Debug is below min level, so it won't be called
      expect(consoleDebugSpy).toHaveBeenCalledTimes(0);
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });
});
