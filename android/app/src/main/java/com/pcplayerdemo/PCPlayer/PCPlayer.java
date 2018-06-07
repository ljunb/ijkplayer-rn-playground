package com.pcplayerdemo.PCPlayer;

import android.content.Context;
import android.os.Handler;
import android.text.TextUtils;
import android.util.Log;
import android.view.Gravity;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import tv.danmaku.ijk.media.player.IMediaPlayer;
import tv.danmaku.ijk.media.player.IjkMediaPlayer;

public class PCPlayer extends FrameLayout {
    private IjkMediaPlayer mediaPlayer = null;
    private SurfaceView surfaceView;
    private String mUrl = "";
    private Context context;
    private Runnable runnable = null;

    private Handler mPlayingHander = new Handler();
    private ReactContext mReactContext;

    public PCPlayer(ReactContext reactContext) {
        super(reactContext);
        this.context = reactContext;
        mReactContext = (ReactContext)getContext();
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
                mediaPlayer.start();
                runnable = new Runnable() {
                    @Override
                    public void run() {
                        // value, currentTime, totalTime, playableDuration
                        WritableMap body = Arguments.createMap();
                        body.putDouble("value", mediaPlayer.getCurrentPosition() / mediaPlayer.getDuration());
                        body.putDouble("currentTime", mediaPlayer.getCurrentPosition());
                        body.putDouble("totalTime", mediaPlayer.getDuration());
                        body.putDouble("playableDuration", mediaPlayer.getDuration());
                        mReactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "onPlaying", body);

                        mPlayingHander.postDelayed(runnable, Math.round(1000));
                    }
                };
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
                mediaPlayer.seekTo(0);
            }
        });
        mediaPlayer.setOnBufferingUpdateListener(new IMediaPlayer.OnBufferingUpdateListener() {
            @Override
            public void onBufferingUpdate(IMediaPlayer iMediaPlayer, int i) {

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
        if (Math.abs(seek) == 15) {

        } else {
            mediaPlayer.seekTo((long) (mediaPlayer.getDuration() * seek));
        }
        System.out.println("seek" + seek + " final " + (long) (mediaPlayer.getDuration() * seek) + "duration " + mediaPlayer.getDuration());
    }

    public void setFullscreen(boolean fullscreen) {
        // todo orientation change
        if (fullscreen) {

        } else {

        }
    }

    public void setVolume(float volume) {
        mediaPlayer.setVolume(volume, volume);
    }
}
