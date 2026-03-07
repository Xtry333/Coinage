import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { CoinageStorageService } from '../core/services/storage-service/coinage-storage.service';
import { CoinageNotification, NotificationLevel, NotificationService } from './notification.service';

function makeMockStorageService(): jest.Mocked<CoinageStorageService> {
    return {
        getNumber: jest.fn().mockReturnValue(undefined),
        setNumber: jest.fn(),
        getObject: jest.fn().mockReturnValue(undefined),
        setObject: jest.fn(),
        attachEventListener: jest.fn(),
        getBoolean: jest.fn(),
        setBoolean: jest.fn(),
        getString: jest.fn(),
        setString: jest.fn(),
    } as any;
}

describe('NotificationService', () => {
    let service: NotificationService;
    let storageService: jest.Mocked<CoinageStorageService>;

    beforeEach(() => {
        storageService = makeMockStorageService();

        TestBed.configureTestingModule({
            providers: [
                NotificationService,
                { provide: CoinageStorageService, useValue: storageService },
            ],
        });
        service = TestBed.inject(NotificationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('.push', () => {
        it('should emit notification on notifications$', async () => {
            const emitted = firstValueFrom(service.notifications$);

            service.push({ title: 'Test', message: 'Hello' });

            const notification = await emitted;
            expect(notification.title).toBe('Test');
            expect(notification.message).toBe('Hello');
        });

        it('should save notification to localStorage via setObject', () => {
            service.push({ title: 'Save Test', message: 'Save me' });

            expect(storageService.setObject).toHaveBeenCalledWith(
                NotificationService.NOTIFICATION_KEY,
                expect.objectContaining({ title: 'Save Test' }),
            );
        });

        it('should set default level to Info when not specified', async () => {
            const emitted = firstValueFrom(service.notifications$);

            service.push({ title: 'Test', message: 'msg' });

            const notification = await emitted;
            expect(notification.level).toBe(NotificationLevel.Info);
        });

        it('should preserve specified level', async () => {
            const emitted = firstValueFrom(service.notifications$);

            service.push({ title: 'Warning', message: 'msg', level: NotificationLevel.Warning });

            const notification = await emitted;
            expect(notification.level).toBe(NotificationLevel.Warning);
        });

        it('should set autoCloseDelay to default when not specified', async () => {
            const emitted = firstValueFrom(service.notifications$);

            service.push({ title: 'Test', message: 'msg' });

            const notification = await emitted;
            expect(notification.autoCloseDelay).toBe(NotificationService.DEFAULT_AUTOCLOSE_DELAY_MS);
        });

        it('should use custom autoCloseDelay when specified', async () => {
            const emitted = firstValueFrom(service.notifications$);

            service.push({ title: 'Test', message: 'msg', autoCloseDelay: 3000 });

            const notification = await emitted;
            expect(notification.autoCloseDelay).toBe(3000);
        });

        it('should return the new notification id', () => {
            storageService.getNumber.mockReturnValue(5);

            const id = service.push({ title: 'Test', message: 'msg' });

            expect(id).toBe(6);
        });

        it('should add notification to history', () => {
            storageService.getObject.mockReturnValueOnce([]);

            service.push({ title: 'History', message: 'msg' });

            expect(storageService.setObject).toHaveBeenCalledWith(
                NotificationService.HISTORICAL_NOTIFICATIONS_KEY,
                expect.arrayContaining([expect.objectContaining({ title: 'History' })]),
            );
        });
    });

    describe('.error', () => {
        it('should push notification with title "Error" and Error level', async () => {
            const emitted = firstValueFrom(service.notifications$);

            service.error('Something went wrong');

            const notification = await emitted;
            expect(notification.title).toBe('Error');
            expect(notification.message).toBe('Something went wrong');
            expect(notification.level).toBe(NotificationLevel.Error);
        });

        it('should use custom autoCloseDelay when specified', async () => {
            const emitted = firstValueFrom(service.notifications$);

            service.error('msg', 5000);

            const notification = await emitted;
            expect(notification.autoCloseDelay).toBe(5000);
        });
    });

    describe('.pushToBarOnly', () => {
        it('should emit notification on notifications$', async () => {
            const emitted = firstValueFrom(service.notifications$);

            service.pushToBarOnly({ title: 'Bar Only', message: 'msg' });

            const notification = await emitted;
            expect(notification.title).toBe('Bar Only');
        });

        it('should NOT write to localStorage for NOTIFICATION_KEY', () => {
            service.pushToBarOnly({ title: 'Bar Only', message: 'msg' });

            const notificationKeyCalls = (storageService.setObject as jest.Mock).mock.calls.filter(
                (call) => call[0] === NotificationService.NOTIFICATION_KEY,
            );
            expect(notificationKeyCalls.length).toBe(0);
        });
    });

    describe('notification ID generation', () => {
        it('should increment ID from last stored value', () => {
            storageService.getNumber.mockReturnValue(10);

            service.push({ title: 'Test', message: 'msg' });

            expect(storageService.setNumber).toHaveBeenCalledWith(NotificationService.LAST_NOTIFICATION_ID_KEY, 11);
        });

        it('should wrap ID back to 1 when at MAX_NOTIFICATION_ID', () => {
            storageService.getNumber.mockReturnValue(NotificationService.MAX_NOTIFICATION_ID);

            const id = service.push({ title: 'Test', message: 'msg' });

            expect(id).toBe(1);
            expect(storageService.setNumber).toHaveBeenCalledWith(NotificationService.LAST_NOTIFICATION_ID_KEY, 1);
        });

        it('should start from 1 when no last ID is stored', () => {
            storageService.getNumber.mockReturnValue(undefined);

            const id = service.push({ title: 'Test', message: 'msg' });

            expect(id).toBe(1);
        });
    });

    describe('.markNotificationAsRead', () => {
        it('should set isRead=true for the given notification ID', () => {
            const historicalNotifications: CoinageNotification[] = [
                { id: 1, title: 'Old', message: 'msg', isRead: false },
                { id: 2, title: 'Other', message: 'msg', isRead: false },
            ];
            storageService.getObject.mockReturnValue(historicalNotifications);

            service.markNotificationAsRead(1);

            const savedNotifications = (storageService.setObject as jest.Mock).mock.calls.find(
                (call) => call[0] === NotificationService.HISTORICAL_NOTIFICATIONS_KEY,
            )?.[1];
            expect(savedNotifications[0].isRead).toBe(true);
            expect(savedNotifications[1].isRead).toBe(false);
        });

        it('should emit updated list on historicalNotifications$', async () => {
            const historicalNotifications: CoinageNotification[] = [{ id: 1, title: 'Test', message: 'msg', isRead: false }];
            storageService.getObject.mockReturnValue(historicalNotifications);

            const emitted = firstValueFrom(service.historicalNotifications$);
            service.markNotificationAsRead(1);

            const updated = await emitted;
            expect(updated[0].isRead).toBe(true);
        });
    });

    describe('.clearHistoricalNotifications', () => {
        it('should clear historical notifications from storage', () => {
            service.clearHistoricalNotifications();

            expect(storageService.setObject).toHaveBeenCalledWith(NotificationService.HISTORICAL_NOTIFICATIONS_KEY, undefined);
        });

        it('should emit empty array on historicalNotifications$', async () => {
            const emitted = firstValueFrom(service.historicalNotifications$);

            service.clearHistoricalNotifications();

            const result = await emitted;
            expect(result).toEqual([]);
        });
    });

    describe('.getHistoricalNotifications', () => {
        it('should return notifications from storage', () => {
            const stored: CoinageNotification[] = [{ id: 1, title: 'Old', message: 'msg' }];
            storageService.getObject.mockReturnValue(stored);

            const result = service.getHistoricalNotifications();

            expect(result).toBe(stored);
        });

        it('should return empty array when nothing in storage', () => {
            storageService.getObject.mockReturnValue(undefined);

            const result = service.getHistoricalNotifications();

            expect(result).toEqual([]);
        });
    });
});
