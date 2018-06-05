package com.pcplayerdemo.PCPlayer;

import android.content.Context;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;

import com.facebook.react.bridge.ReactContext;

import tv.danmaku.ijk.media.player.IMediaPlayer;
import tv.danmaku.ijk.media.player.IjkMediaPlayer;

public class PCPlayer extends View {
    private IjkMediaPlayer mediaPlayer = null;
    private SurfaceView surfaceView;
    private String mUrl = "http://covertness.qiniudn.com/android_zaixianyingyinbofangqi_test_baseline.mp4";
    private Context context;

    public PCPlayer(ReactContext reactContext) {
        super(reactContext);
        this.context = reactContext;
        createSurfaceView();
    }

    private void createSurfaceView() {
        surfaceView = new SurfaceView(context);
        ViewGroup.LayoutParams framelayout_params =
                new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT);
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

        surfaceView.setLayoutParams(framelayout_params);
    }

    private void setupPlayer() {
        if (mediaPlayer != null) {
            mediaPlayer.stop();
            mediaPlayer.setDisplay(null);
            mediaPlayer.release();
        }
        mediaPlayer = new IjkMediaPlayer();
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
    }

    public void setUrl(String url) {
        mUrl = url;
    }
}
