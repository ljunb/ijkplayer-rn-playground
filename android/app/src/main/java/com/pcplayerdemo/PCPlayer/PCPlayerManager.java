package com.pcplayerdemo.PCPlayer;

import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

import javax.annotation.Nullable;

public class PCPlayerManager extends SimpleViewManager<PCPlayer> {
    private static final String REACT_CLASS = "PCPlayer";

    @Nullable
    @Override
    public Map<String, Object> getExportedCustomBubblingEventTypeConstants() {
        MapBuilder.Builder builder = MapBuilder.builder();
        builder.put("onPlaying", "onPlaying");
        return builder.build();
    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected PCPlayer createViewInstance(ThemedReactContext reactContext) {
        return new PCPlayer(reactContext);
    }

    @ReactProp(name = "url")
    public void setUrl(PCPlayer player, String url) {
        player.setUrl(url);
    }

    @ReactProp(name = "height")
    public void setHeight(PCPlayer player, float height) {

    }

    @ReactProp(name = "width")
    public void setWidth(PCPlayer player, float width) {

    }

    @ReactProp(name = "pause")
    public void setPause(PCPlayer player, boolean pause) {
        player.setPause(pause);
    }

    @ReactProp(name = "seek")
    public void setSeek(PCPlayer player, float seek) {
        player.setSeek(seek);
    }

    @ReactProp(name = "fullscreen")
    public void setFullscreen(PCPlayer player, boolean fullscreen) {
        player.setFullscreen(fullscreen);
    }

    @ReactProp(name = "volume")
    public void setVolume(PCPlayer player, float volume) {
        player.setVolume(volume);
    }
}
