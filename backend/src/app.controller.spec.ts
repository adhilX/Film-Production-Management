import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('test', () => {
    it('should return status ok and a message', () => {
      const response = appController.getTest();
      expect(response.status).toBe('ok');
      expect(response.message).toBe('Test API is working successfully');
      expect(response.timestamp).toBeDefined();
    });
  });
});

