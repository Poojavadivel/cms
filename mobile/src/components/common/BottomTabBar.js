import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BottomTabBar = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];

                    // Skip hidden tabs (Invoice, pathology etc in Admin)
                    if (options.tabBarButton && typeof options.tabBarButton === 'function' && options.tabBarButton() === null) {
                        return null;
                    }

                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    const iconName = options.tabBarIconName || 'help-outline';

                    return (
                        <TouchableOpacity
                            key={index}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={styles.tabItem}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.pill, isFocused && styles.activePill]}>
                                <MaterialIcons
                                    name={iconName}
                                    size={24}
                                    color={isFocused ? '#1E293B' : '#64748B'}
                                />
                            </View>
                            <Text style={[styles.label, isFocused && styles.activeLabel]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
    },
    scrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        gap: 8,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 72,
        paddingHorizontal: 4,
    },
    pill: {
        width: 60,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    activePill: {
        backgroundColor: '#EFF6FF',
    },
    label: {
        fontSize: 11,
        fontWeight: '500',
        color: '#64748B',
    },
    activeLabel: {
        color: '#1E293B',
        fontWeight: '700',
    },
});

export default BottomTabBar;
