package com.pcplayerdemo.PCPlayer;

import android.content.Context;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.facebook.react.bridge.ReactContext;

import tv.danmaku.ijk.media.player.IMediaPlayer;
import tv.danmaku.ijk.media.player.IjkMediaPlayer;

public class PCPlayer extends FrameLayout {
    private IjkMediaPlayer mediaPlayer = null;
    private SurfaceView surfaceView;
    private String mUrl = "";
    private Context context;

    public PCPlayer(ReactContext reactContext) {
        super(reactContext);
        this.context = reactContext;
    }

    private void createSurfaceView() {
        surfaceView = new SurfaceView(context);
        LayoutParams layoutParams = new LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT, Gravity.CENTER);
        surfaceView.getHolder().addCallback(new SurfaceHolder.Callback() {
            @Override
            public void surfaceCreated(SurfaceHolder holder) {

            }

            @Override
            public void surfaceChanged(SurfaceHolder holder, int format, int width, int height) {
                setupPlayer();
            }

            @Override
            public void surfaceDestroyed(SurfaceHolder holder) {

            }
        });

        surfaceView.setLayoutParams(layoutParams);
        this.addView(surfaceView);
    }

    private void setupPlayer() {
        if (mediaPlayer != null) {
            mediaPlayer.stop();
            mediaPlayer.setDisplay(null);
            mediaPlayer.release();
        }
        mediaPlayer = new IjkMediaPlayer();
        IjkMediaPlayer.native_setLogLevel(IjkMediaPlayer.IJK_LOG_DEBUG);
        mediaPlayer.setOnPreparedListener(new IMediaPlayer.OnPreparedListener() {
            @Override
            public void onPrepared(IMediaPlayer iMediaPlayer) {

            }
        });
        mediaPlayer.setOnSeekCompleteListener(new IMediaPlayer.OnSeekCompleteListener() {
            @Override
            public void onSeekComplete(IMediaPlayer iMediaPlayer) {

            }
        });
        mediaPlayer.setOnCompletionListener(new IMediaPlayer.OnCompletionListener() {
            @Override
            public void onCompletion(IMediaPlayer iMediaPlayer) {

            }
        });
        try {
            IjkMediaPlayer.loadLibrariesOnce(null);
            IjkMediaPlayer.native_profileBegin("libijkplayer.so");
            mediaPlayer.setDataSource(mUrl);
        } catch (Exception e) {

        }
        mediaPlayer.setDisplay(surfaceView.getHolder());
        mediaPlayer.prepareAsync();
        mediaPlayer.start();
    }

    // ------------------------ 面向 PCPlayerManager 的方法 ------------------------
    public void setUrl(String url) {
        if (TextUtils.equals("", mUrl)) {
            mUrl = url;
            createSurfaceView();
        } else {
            mUrl = url;
            setupPlayer();
        }
    }

    public void setPause(boolean pause) {
        if (mediaPlayer != null) {
            if (mediaPlayer.isPlaying()) {
                mediaPlayer.pause();
            } else {
                mediaPlayer.start();
            }
        }
    }

    public void setSeek(float seek) {
        if (mediaPlayer == null) return;
        // todo seek
    }

    public void setFullscreen(boolean fullscreen) {
        // todo orientation change
        if (fullscreen) {

        } else {

        }
    }
}
