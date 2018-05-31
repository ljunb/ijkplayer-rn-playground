/**
 * Description : 基于 ijkplayer 集成的播放器组件
 *
 * Author : cookiej
 * Date   : 2018/5/30
 * Time   : 15:27
 */
import React, { Component, PureComponent } from 'react';
import {
  Dimensions,
  requireNativeComponent,
  StyleSheet,
  View,
  Slider,
  NativeModules,
  Text,
  TouchableOpacity,
  Animated
} from 'react-native';

const MPCPlayerKit = NativeModules.PCPlayerKit;
const MPCPlayer = requireNativeComponent('PCPlayer', PCPlayerView);
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left:0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row',
    alignItems: 'center'
  },
  seekBtn: {
    paddingHorizontal: 5,
    paddingVertical: 4,
    marginRight: 8
  },
  slider: {
    width: SCREEN_WIDTH - 150
  }
});

export default class PCPlayerView extends Component {
  constructor(props) {
    super(props);
    this.screenW = new Animated.Value(props.style.width);
    this.screenH = new Animated.Value(props.style.height);
  }
  state = {
    isPause: false
  };
  isShowBottomBar = false;
  animationValue = new Animated.Value(0);
  dismissDelay = 3;
  isFullscreen = false;

  handleOrientationChange = evt => {
    const { window, fullscreen } = evt.nativeEvent;
    console.log(`FullScreen: ${fullscreen} Window: w - ${window.width}; h - ${window.height}`);
    Animated.parallel([
      Animated.timing(this.screenW, {
        toValue: window.width,
      }),
      Animated.timing(this.screenH, {
        toValue: window.height,
      })
    ]).start()
  };

  handleValueChange = value => {
    this.handleSeek(value);
  };

  handleSeek = time => {
    this.delayDismiss();
    this.player.setNativeProps({seek: time});
  };

  handlePause = () => {
    this.delayDismiss();
    this.player.setNativeProps({pause: !this.state.isPause});
    this.setState({isPause: !this.state.isPause});
  };

  handleFullScreen = () => {
    this.delayDismiss();
    this.isFullscreen = !this.isFullscreen;
    this.player.setNativeProps({fullscreen: this.isFullscreen});
  };

  renderBottomBar = () => {
    const { isPause } = this.state;
    const pauseText = isPause ? 'Play' : 'Pause';

    const translateY = this.animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [40, 0]
    });
    return (
      <Animated.View style={[styles.bottomBar, {transform: [{translateY}]}]}>
        <TouchableOpacity onPress={() => this.handleSeek(-15)} style={styles.seekBtn}>
          <Text>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.handlePause} style={styles.seekBtn}>
          <Text>{pauseText}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => this.handleSeek(15)} style={styles.seekBtn}>
          <Text>→</Text>
        </TouchableOpacity>
        <Slider
          style={styles.slider}
          onValueChange={this.handleValueChange}
        />
        <TouchableOpacity onPress={this.handleFullScreen}>
          <Text>Full</Text>
        </TouchableOpacity>
      </Animated.View>
    )
  };

  handlePressPlayer = () => {
    if (this.isShowBottomBar) return;
    this.isShowBottomBar = true;

    Animated.timing(this.animationValue, {
      toValue: 1
    }).start(this.delayDismiss);
  };

  delayDismiss = () => {
    this.clearDismissTimer();
    this.delayTimer = setTimeout(() => {
      Animated.timing(this.animationValue, {
        toValue: 0
      }).start(() => {
        this.isShowBottomBar = false;
      });
    }, this.dismissDelay * 1000);
  };

  clearDismissTimer = () => this.delayTimer && clearTimeout(this.delayTimer);

  render() {
    const { style: {height, width}, ...rest } = this.props;

    return (
      <Animated.View
        style={{overflow: 'hidden', width: this.screenW, height: this.screenH, backgroundColor: '#ccc'}}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={this.handlePressPlayer}
        >
          <MPCPlayer
            ref={r => this.player = r}
            {...rest}
            height={height}
            width={width}
            onOrientationChange={this.handleOrientationChange}
          />
        </TouchableOpacity>
        {this.renderBottomBar()}
      </Animated.View>
    )
  }
}

