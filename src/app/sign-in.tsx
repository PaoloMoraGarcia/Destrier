import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/lib/session';
import { colors, radius, spacing, type } from '@/theme';

/**
 * Entrar con el correo y un código.
 *
 * Sin contraseñas y sin login social a propósito. Una contraseña más que
 * recordar es fricción, y añadir Google o Facebook obligaría a implementar
 * también Sign in with Apple (guideline 4.8), que no se puede montar hasta tener
 * cuenta de desarrollador. Con solo correo, ese requisito no aplica.
 */
export default function SignInRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requestCode, verifyCode } = useSession();

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitEmail = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await requestCode(email.trim());
      setStep('code');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo enviar el código');
    } finally {
      setBusy(false);
    }
  }, [email, requestCode]);

  const submitCode = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await verifyCode(email.trim(), code.trim());
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Código incorrecto');
    } finally {
      setBusy(false);
    }
  }, [email, code, verifyCode, router]);

  const onEmailStep = step === 'email';
  const canSubmit = onEmailStep ? email.includes('@') : code.trim().length >= 6;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.content, { paddingTop: insets.top + spacing.xxxl }]}>
        <Text style={styles.title}>
          {onEmailStep ? 'Your email' : 'Check your email'}
        </Text>
        <Text style={styles.subtitle}>
          {onEmailStep
            ? 'No passwords. We send a code and that is it.'
            : `We sent a code to ${email.trim()}.`}
        </Text>

        {onEmailStep ? (
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            autoFocus
            onSubmitEditing={canSubmit ? submitEmail : undefined}
          />
        ) : (
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={code}
            onChangeText={setCode}
            placeholder="000000"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={8}
            autoFocus
            onSubmitEditing={canSubmit ? submitCode : undefined}
          />
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          disabled={!canSubmit || busy}
          onPress={onEmailStep ? submitEmail : submitCode}
          accessibilityRole="button">
          {busy ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.buttonLabel}>{onEmailStep ? 'Send code' : 'Enter'}</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.dismiss}>Not now</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    ...type.largeTitle,
    color: colors.text.primary,
  },
  subtitle: {
    ...type.body,
    color: colors.text.secondary,
  },
  input: {
    ...type.title,
    color: colors.text.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glass.stroke,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  codeInput: {
    letterSpacing: 8,
  },
  error: {
    ...type.footnote,
    color: colors.amber,
  },
  button: {
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  buttonLabel: {
    ...type.body,
    fontWeight: '700',
    color: colors.background,
  },
  dismiss: {
    ...type.footnote,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
