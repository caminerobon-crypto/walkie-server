package com.example.walkietalkie

import android.Manifest
import android.content.pm.PackageManager
import android.media.*
import android.os.Bundle
import android.view.MotionEvent
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import okhttp3.*
import okio.ByteString
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {

    private lateinit var webSocket: WebSocket
    private lateinit var audioRecord: AudioRecord
    private lateinit var audioTrack: AudioTrack

    private var isRecording = false
    private val sampleRate = 16000

    private val bufferSize = AudioRecord.getMinBufferSize(
        sampleRate,
        AudioFormat.CHANNEL_IN_MONO,
        AudioFormat.ENCODING_PCM_16BIT
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        requestMicPermission()
        connectWebSocket()
        initAudioTrack()

        val btnTalk = findViewById<Button>(R.id.btnTalk)

        btnTalk.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> startRecording()
                MotionEvent.ACTION_UP -> stopRecording()
            }
            true
        }
    }

    private fun requestMicPermission() {
        if (ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.RECORD_AUDIO
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.RECORD_AUDIO),
                1
            )
        }
    }

    private fun connectWebSocket() {

        val client = OkHttpClient.Builder()
            .readTimeout(0, TimeUnit.MILLISECONDS)
            .build()

        val request = Request.Builder()
            .url("wss://walkie-server-production-9b88.up.railway.app")
            .build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {

            override fun onOpen(webSocket: WebSocket, response: Response) {
                println("Conectado")
            }

            override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
                playAudio(bytes.toByteArray())
            }

            override fun onFailure(
                webSocket: WebSocket,
                t: Throwable,
                response: Response?
            ) {
                println("Error: ${t.message}")
            }
        })
    }

    private fun startRecording() {

        audioRecord = AudioRecord(
            MediaRecorder.AudioSource.MIC,
            sampleRate,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            bufferSize
        )

        audioRecord.startRecording()
        isRecording = true

        Thread {
            val buffer = ByteArray(bufferSize)
            while (isRecording) {
                val read = audioRecord.read(buffer, 0, buffer.size)
                if (read > 0) {
                    webSocket.send(buffer)
                }
            }
        }.start()
    }

    private fun stopRecording() {
        isRecording = false
        audioRecord.stop()
        audioRecord.release()
    }

    private fun initAudioTrack() {
        audioTrack = AudioTrack(
            AudioManager.STREAM_MUSIC,
            sampleRate,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            bufferSize,
            AudioTrack.MODE_STREAM
        )
        audioTrack.play()
    }

    private fun playAudio(data: ByteArray) {
        audioTrack.write(data, 0, data.size)
    }
}
