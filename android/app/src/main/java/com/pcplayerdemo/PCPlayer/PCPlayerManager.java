package com.pcplayerdemo.PCPlayer;

import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

public class PCPlayerManager extends SimpleViewManager<PCPlayer>{
    public static final String REACT_CLASS = "PCPlayer";

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

    }

    @ReactProp(name = "height")
    public void setHeight(PCPlayer player, float height) {

    }

    @ReactProp(name = "width")
    public void setWidth(PCPlayer player, float width) {

    }
}
