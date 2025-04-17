import { Audio } from 'expo-av';
import { useEffect, useState } from 'react';
import { Button, View, Text, Alert } from 'react-native';

const token = process.env.EXPO_PUBLIC_ACCESS_TOKEN;
export default function AudioPage() {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [status, setStatus] = useState('Listo para grabar');
    const [audioUri, setAudioUri] = useState<string | null>(null);

    useEffect(() => {
        const getPermission = async () => {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso de micrófono denegado');
            }
        };

        getPermission();
    }, []);

    const startRecording = async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const recordingOptions: Audio.RecordingOptions = {
                android: {
                    extension: '.wav',
                    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
                    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
                    sampleRate: 16000,
                    numberOfChannels: 1,
                    bitRate: 128000,
                },
                ios: {
                    extension: '.wav',
                    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
                    sampleRate: 16000,
                    numberOfChannels: 1,
                    bitRate: 128000,
                    outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
                    linearPCMBitDepth: 16,
                    linearPCMIsBigEndian: false,
                    linearPCMIsFloat: false,
                },
                web: {
                    mimeType: 'audio/webm',
                    bitsPerSecond: 128000,
                },
                isMeteringEnabled: false,
            };
            const { recording } = await Audio.Recording.createAsync(recordingOptions);

            setRecording(recording);
            setStatus('Grabando...');
        } catch (error) {
            console.error('Error al comenzar la grabación:', error);
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);
            setAudioUri(uri);
            setStatus('Grabación detenida');
            console.log('Audio guardado en:', uri);
        } catch (error) {
            console.error('Error al detener la grabación:', error);
        }
    };
    const sendAudioToWitAI = async () => {
        if (!audioUri) return;
        try {
            const audioBlob = await fetch(audioUri).then(res => res.blob());
            const response = await fetch('https://api.wit.ai/speech?v=20250417', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'audio/wav',
                },
                body: audioBlob,
            });
            const textResponse = await response.text();
            const regex = /"is_final": true,\s*"text": "(.*)"/;

            const match = regex.exec(textResponse);
            if (match) {
                console.log(match[1]); // Outputs: Hello world
                Alert.alert('Texto reconocido', match[1]);
            }
        } catch (error) {
            console.error('Error al enviar audio a Wit.ai:', error);
            Alert.alert('Error', 'No se pudo procesar el audio');
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <Text>{status}</Text>
            <Button title="Iniciar grabación" onPress={startRecording} />
            <Button title="Detener grabación" onPress={stopRecording} disabled={!recording} />
            <Button title="Enviar audio a Wit.ai" onPress={sendAudioToWitAI} disabled={!audioUri} />
        </View>
    );
}
