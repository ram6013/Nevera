/* eslint-disable prettier/prettier */
const token = process.env.EXPO_PUBLIC_ACCESS_TOKEN;

export async function sendAudioToWitAI (audioUri: string | null)    {
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
            return { status: 'Succes', text: match[1]};
        }
    } catch (error) {
        console.error('Error al enviar audio a Wit.ai:', error);
        return {status: 'Error', message:'No se pudo procesar el audio'};
    }
};

