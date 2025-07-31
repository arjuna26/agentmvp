import { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (err) setError(err.message);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left']}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <LinearGradient 
        colors={['#0f172a', '#1e293b', '#334155']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.heroContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="partly-sunny" size={64} color="#60a5fa" />
            </View>
            <Text style={styles.appTitle}>WeatherCast</Text>
            <Text style={styles.welcomeText}>Welcome back</Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              theme={{
                colors: {
                  primary: '#60a5fa',
                  onSurface: '#f8fafc',
                  surface: 'rgba(30,41,59,0.95)',
                  onSurfaceVariant: '#94a3b8',
                  outline: 'rgba(59,130,246,0.3)',
                }
              }}
              mode="outlined"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              theme={{
                colors: {
                  primary: '#60a5fa',
                  onSurface: '#f8fafc',
                  surface: 'rgba(30,41,59,0.95)',
                  onSurfaceVariant: '#94a3b8',
                  outline: 'rgba(59,130,246,0.3)',
                }
              }}
              mode="outlined"
            />
            
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={16} color="#f87171" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button 
              mode="contained" 
              onPress={handleLogin} 
              loading={loading} 
              style={styles.loginButton}
              labelStyle={styles.loginButtonLabel}
              buttonColor="#3b82f6"
            >
              Sign In
            </Button>

            <TouchableOpacity 
              style={styles.signupButton}
              onPress={() => navigation.navigate('SignUp')}
            >
              <Text style={styles.signupText}>Don't have an account? </Text>
              <Text style={styles.signupTextAccent}>Create one</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 48,
    padding: 40,
    backdropFilter: 'blur(40px)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 25,
  },
  iconContainer: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderRadius: 50,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
  },
  appTitle: {
    fontSize: 36,
    color: '#ffffff',
    fontWeight: '100',
    marginBottom: 16,
    letterSpacing: -1,
  },
  welcomeText: {
    fontSize: 24,
    color: '#f8fafc',
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  subtitleText: {
    fontSize: 14,
    color: '#60a5fa',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(30,41,59,0.95)',
    borderRadius: 28,
    padding: 32,
    backdropFilter: 'blur(25px)',
    borderWidth: 2,
    borderColor: 'rgba(59,130,246,0.25)',
    elevation: 25,
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'rgba(30,41,59,0.95)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  loginButton: {
    borderRadius: 16,
    paddingVertical: 8,
    marginBottom: 24,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  signupButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '400',
  },
  signupTextAccent: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: '600',
  },
});
