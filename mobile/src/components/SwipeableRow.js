import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, View, I18nManager } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { MaterialIcons } from '@expo/vector-icons';

const SwipeableRow = ({ children, onDelete, onEdit, editLabel = "Edit", deleteLabel = "Delete" }) => {
    const swipeableRow = useRef(null);

    const close = () => {
        swipeableRow.current?.close();
    };

    const renderRightAction = (text, color, x, progress, onPress, icon) => {
        const trans = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [x, 0],
        });

        return (
            <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
                <RectButton
                    style={[styles.rightAction, { backgroundColor: color }]}
                    onPress={() => {
                        close();
                        onPress && onPress();
                    }}>
                    <MaterialIcons name={icon} size={24} color="white" />
                    <Text style={styles.actionText}>{text}</Text>
                </RectButton>
            </Animated.View>
        );
    };

    const renderRightActions = (progress, _dragAnimatedValue) => (
        <View style={{ width: 140, flexDirection: 'row' }}>
            {onEdit && renderRightAction(editLabel, '#3B82F6', 140, progress, onEdit, 'edit')}
            {onDelete && renderRightAction(deleteLabel, '#EF4444', 70, progress, onDelete, 'delete')}
        </View>
    );

    return (
        <Swipeable
            ref={swipeableRow}
            friction={2}
            enableTrackpadTwoFingerGesture
            rightThreshold={40}
            renderRightActions={renderRightActions}
        >
            {children}
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    rightAction: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    actionText: {
        color: 'white',
        fontSize: 12,
        backgroundColor: 'transparent',
        paddingTop: 4,
        fontWeight: '600',
    },
});

export default SwipeableRow;
