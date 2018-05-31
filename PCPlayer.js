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
  seekBtnWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 100,
    marginLeft: 10
  },
  seekBtn: {
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    height: 26,
    width: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center'
  },
  slider: {
    flex: 1,
    marginHorizontal: 10
  },
  fullScreenBtn: {
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    height: 26,
    width: 26,
    borderRadius: 13
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left:0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15
  },
  backBtn: {
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    height: 26,
    width: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#999',
    fontSize: 15
  }
});

export default class PCPlayerView extends Component {
  constructor(props) {
    super(props);
    this.screenW = new Animated.Value(props.style.width);
    this.screenH = new Animated.Value(props.style.height);
    this.state = {
      isPause: true
    };
    this.isShowBottomBar = false;
    this.animationValue = new Animated.Value(0);
    this.isFullscreen = false;
  }

  /**
   * 屏幕旋转时，更新RN界面
   */
  handleOrientationChange = evt => {
    const { window, fullscreen } = evt.nativeEvent;
    this.isFullscreen = fullscreen;
    console.log(`FullScreen: ${fullscreen} Window: w - ${window.width}; h - ${window.height}`);

    // RN 界面的动画
    Animated.parallel([
      Animated.timing(this.screenW, {
        toValue: window.width,
        duration: 200
      }),
      Animated.timing(this.screenH, {
        toValue: window.height,
        duration: 200
      })
    ]).start()
  };

  /**
   * 滑动 slider，更新播放进度
   * @param value
   */
  handleValueChange = value => {
    this.handleSeek(value);
  };

  /**
   * 点击 快进/快退（15s）
   * @param time
   */
  handleSeek = time => {
    this.delayDismiss();
    this.player.setNativeProps({seek: time});
  };

  /**
   * 点击 播放/暂停
   */
  handlePause = () => {
    this.delayDismiss();
    this.player.setNativeProps({pause: !this.state.isPause});
    this.setState({isPause: !this.state.isPause});
  };

  /**
   * 点击是否全屏
   */
  handleFullScreen = () => {
    this.delayDismiss();
    this.player.setNativeProps({fullscreen: !this.isFullscreen});
  };

  /**
   * 播放过程中同步 slider
   * @param evt
   */
  handleChange = evt => {
    this.slider && this.slider.setNativeProps({value: evt.nativeEvent.value});
  };

  /**
   * 点击屏幕，显示工具条
   */
  handlePressPlayer = () => {
    if (this.isShowBottomBar) return;
    this.isShowBottomBar = true;

    Animated.timing(this.animationValue, {
      toValue: 1
    }).start(this.delayDismiss);
  };

  /**
   * 延迟消失工具条
   */
  delayDismiss = () => {
    this.clearDismissTimer();
    this.delayTimer = setTimeout(() => {
      Animated.timing(this.animationValue, {
        toValue: 0
      }).start(() => {
        this.isShowBottomBar = false;
      });
    }, 3000);
  };

  clearDismissTimer = () => this.delayTimer && clearTimeout(this.delayTimer);

  /**
   * 点击返回
   */
  handleBack = () => {
    if (this.isFullscreen) {
      this.handleFullScreen();
    }
  };

  renderBottomBar = () => {
    const { isPause } = this.state;
    const pauseText = isPause ? 'PL' : 'PA';

    const translateY = this.animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [40, 0]
    });
    return (
      <Animated.View style={[styles.bottomBar, {transform: [{translateY}]}]}>
        <View style={styles.seekBtnWrapper}>
          <TouchableOpacity onPress={() => this.handleSeek(-15)} style={styles.seekBtn}>
            <Text>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this.handlePause} style={styles.seekBtn}>
            <Text>{pauseText}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => this.handleSeek(15)} style={styles.seekBtn}>
            <Text>→</Text>
          </TouchableOpacity>
        </View>
        <Slider
          ref={r => this.slider = r}
          style={styles.slider}
          onValueChange={this.handleValueChange}
        />
        <TouchableOpacity onPress={this.handleFullScreen} style={styles.fullScreenBtn}>
        </TouchableOpacity>
      </Animated.View>
    )
  };

  renderTopBar = () => {
    const translateY = this.animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-40, 0]
    });
    return (
      <Animated.View style={[styles.topBar, {transform: [{translateY}]}]}>
        <TouchableOpacity onPress={this.handleBack} style={styles.backBtn}>
          <Text>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>测试标题</Text>
      </Animated.View>
    )
  };

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
            onChange={this.handleChange}
            onPlayComplete={() => this.setState({isPause: true})}
          />
        </TouchableOpacity>
        {this.renderTopBar()}
        {this.renderBottomBar()}
      </Animated.View>
    )
  }
}

