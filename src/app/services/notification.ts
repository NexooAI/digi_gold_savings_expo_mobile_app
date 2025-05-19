// services/notification.ts
import Toast from 'react-native-root-toast';

type ToastType = 'success' | 'error' | 'info' | 'warning';

let currentToast: any = null;

export const showToast = (
    message: string,
    type: ToastType = 'info',
    duration: number = Toast.durations.LONG
) => {
    let backgroundColor = '#333';
    let textColor = '#FFF';

    switch (type) {
        case 'success':
            backgroundColor = '#4CAF50';
            break;
        case 'error':
            backgroundColor = '#F44336';
            break;
        case 'warning':
            backgroundColor = '#FF9800';
            break;
        case 'info':
        default:
            backgroundColor = '#2196F3';
            break;
    }

    if (currentToast) {
        Toast.hide(currentToast);
        currentToast = null;
    }

    currentToast = Toast.show(message, {
        duration,
        position: Toast.positions.BOTTOM,
        shadow: true,
        animation: true,
        hideOnPress: true,
        delay: 0,
        backgroundColor,
        textColor,
        containerStyle: {
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginHorizontal: 16,
            marginBottom: 16,
        },
        textStyle: {
            fontSize: 14,
            fontWeight: '500',
        },
    });
};

export const hideToast = () => {
    if (currentToast) {
        Toast.hide(currentToast);
        currentToast = null;
    }
};