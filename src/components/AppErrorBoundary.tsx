import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type State = {
  hasError: boolean;
};

export default class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch() {
    // Keep app alive in production even if a render-time error occurs.
  }

  private handleReload = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Ứng dụng đang gặp lỗi tạm thời</Text>
          <Text style={styles.subtitle}>Vui lòng thử mở lại màn hình.</Text>
          <Pressable style={styles.button} onPress={this.handleReload}>
            <Text style={styles.buttonText}>Thử lại</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F5F8FF',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A8A',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
