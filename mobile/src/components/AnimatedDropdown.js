import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

const { height, width } = Dimensions.get('window');

const AnimatedDropdown = ({ visible, options, currentValue, onSelect, onClose, topPosition = 50 }) => {
    const [show, setShow] = useState(visible);
    const dropdownAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setShow(true);
            dropdownAnim.setValue(0);
            Animated.spring(dropdownAnim, {
                toValue: 1,
                friction: 6,
                tension: 50,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(dropdownAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start(() => setShow(false));
        }
    }, [visible]);

    if (!show) return null;

    const translateY = dropdownAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-20, 0]
    });

    const opacity = dropdownAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1]
    });

    return (
        <>
            {/* Transparent backdrop to close on click outside */}
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>

            <Animated.View
                style={[
                    styles.dropdownMenu,
                    {
                        top: topPosition,
                        opacity: opacity,
                        transform: [{ translateY }, { scale: dropdownAnim }]
                    }
                ]}
            >
                {options.map((opt, index) => {
                    const isSelected = currentValue === opt;
                    return (
                        <TouchableOpacity
                            key={index}
                            style={[styles.dropdownOption, isSelected && styles.dropdownOptionActive]}
                            onPress={() => {
                                onSelect(opt);
                                // The parent should toggle 'visible' to false, which triggers the useEffect exit animation
                                // onClose(); // Should we call this? 
                                // If onSelect updates state that causes re-render, parent might keep it open?
                                // Usually selecting an option closes the dropdown.
                                // Let's expect the parent to handle closing via onSelect or we explicitly call onClose.
                                onClose();
                            }}
                        >
                            <Text style={[styles.dropdownOptionText, isSelected && styles.dropdownOptionTextActive]}>
                                {opt}
                            </Text>
                            {isSelected && <Feather name="check" size={16} color="#FFF" />}
                        </TouchableOpacity>
                    );
                })}
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: -1000,
        left: -1000,
        right: -1000,
        bottom: -1000,
        height: height * 4,
        width: width * 4,
        zIndex: 999,
        backgroundColor: 'transparent'
    },
    dropdownMenu: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        padding: 5,
        elevation: 5,
        shadowColor: '#6366F1',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        zIndex: 1000
    },
    dropdownOption: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2
    },
    dropdownOptionActive: { backgroundColor: '#3B82F6' },
    dropdownOptionText: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
    dropdownOptionTextActive: { color: '#FFF', fontWeight: '700' },
});

export default AnimatedDropdown;
