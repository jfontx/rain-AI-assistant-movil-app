import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export class ErrorBoundary extends React.Component<any, any> {
  state = { error: null as any };
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, padding: 20, paddingTop: 60, backgroundColor: 'red' }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>ErrorBoundary Caught:</Text>
          <Text style={{ color: 'white', marginTop: 10 }}>{String(this.state.error)}</Text>
          <Text style={{ color: 'white', marginTop: 10, fontSize: 10 }}>{this.state.error.stack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}
