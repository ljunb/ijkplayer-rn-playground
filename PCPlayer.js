/**
 * Description : 基于 ijkplayer 集成的播放器组件
 *
 * Author : cookiej
 * Date   : 2018/5/30
 * Time   : 15:27
 */
import React, { Component } from 'react';
import {
  requireNativeComponent,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  NetInfo,
  ImageBackground,
  PanResponder,
  NativeModules
} from 'react-native';
import PropTypes from 'prop-types';
import PlayerSlider from "./PlayerSlider";

const PCPlayerManager = NativeModules.PCPlayerManager;
const MPCPlayer = requireNativeComponent('PCPlayer', PCPlayerView);
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
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    justifyContent: 'space-between'
  },
  timeLabel: {
    color: '#999',
    fontSize: 12,
    width: 36,
    textAlign: 'center'
  },
  timeLine: {
    color: '#999',
    fontSize: 12
  },
  panHandlersView: {
    position: 'absolute',
    top: 40,
    left: 0,
    bottom: 40,
    right: 40,
    backgroundColor: 'transparent'
  }
});

const PlayState = {
  'Idle': 0, // 初始状态
  'Buffering': 1, // 缓冲中
  'Playing': 2, // 播放中
  'Pause': 3, // 暂停
  'Stop': 4, // 播放完毕
  'NetError': 5 // 网络出错
};

export default class PCPlayerView extends Component {
  static propTypes = {
    coverUrl: PropTypes.string,
    LoadingComponent: PropTypes.any,
    NetErrorComponent: PropTypes.any,
    BottomBarComponent: PropTypes.any,
    TopBarComponent: PropTypes.any,
    onSeekStep: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.screenWValue = new Animated.Value(props.style.width);
    this.screenHValue = new Animated.Value(props.style.height);
    this.screenWidth = props.style.width;
    this.screenHeight = props.style.height;
    this.state = {
      playState: PlayState.Idle,
      currentTime: 0,
      totalTime: 0,
    };
    this.isShowBottomBar = false;
    this.animationValue = new Animated.Value(0);
    this.isFullscreen = false;
    this.netInfoType = null;
    this.currentValue = 0;
    this.bufferValue = 0;
    this.createPanResponder();
  }

  componentDidMount() {
    NetInfo.removeEventListener('connectionChange', this.handleConnectionChange);
    NetInfo.addEventListener('connectionChange', this.handleConnectionChange);
  }

  componentWillUnmount() {
    NetInfo.removeEventListener('connectionChange', this.handleConnectionChange);
  }

  createPanResponder = () => {
    this.panResponder = PanResponder.create({
      // onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: this.handleResponderGrant,
      onPanResponderMove: this.handlePanResponderMove,
      onPanResponderRelease: this.handlePanResponderRelease,
    });
  };

  handleResponderGrant = () => {
    this.handlePressPlayer();
  };

  handlePanResponderMove = (evt, ges) => {
    const { locationX } = evt.nativeEvent;
    const stepAreaBeginX = 0.25 * this.screenWidth;

    if (ges.dx === 0 && ges.dy === 0) return;
    if (ges.dx !== 0) {
      // 中间的水平滑动手势，处理快进/快退
      if (locationX >= stepAreaBeginX && locationX <= this.screenWidth - stepAreaBeginX) {
        const step = ges.moveX / 66 * (ges.dx > 0 ? 1 : -1);
        this.currentValue += step / this.state.totalTime;
        this.currentValue = Math.max(this.currentValue, 0);
        this.currentValue = Math.min(this.currentValue, this.bufferValue);
        this.currentValue = Math.min(this.currentValue, 1);

        this.player && this.player.setNativeProps({ seek: this.currentValue });
        this.slider && this.slider.updateIndicator(this.currentValue);
      }
    }
    if (ges.dy !== 0) {
      // 左边区域，亮度调节
      if (locationX <= stepAreaBeginX) {
        const brightness = ges.moveY / 15000 * (ges.dy> 0 ? 1 : -1);
        PCPlayerManager.updateBrightness(brightness);
      } else if (locationX >= this.screenWidth - stepAreaBeginX) {
        // 右边区域，音量调节
        const volume = ges.moveY / 2000 * (ges.dy> 0 ? 1 : -1);
        this.player && this.player.setNativeProps({volume});
      }
    }
  };

  handlePanResponderRelease = () => {

  };

  /**
   * 监听网络状态变化
   * @param connectionInfo type
   * none - device is offline
   * wifi - device is online and connected via wifi, or is the iOS simulator
   * cellular - device is connected via Edge, 3G, WiMax, or LTE
   * unknown - error case and the network status is unknown
   */
  handleConnectionChange = connectionInfo => {
    const { type } = connectionInfo;
    this.netInfoType = type;

    if (this.state.playState === PlayState.Playing) return;
    this.setupPlayer();
    console.log(`Connection info type: ${type}`);
  };

  /**
   * 默认是不播放的
   */
  setupPlayer = () => {
    if (this.netInfoType === 'cellular') {
      console.log(`当前非WiFi，是否继续使用流量播放？`);
      // todo: 添加提示
      // this.setState({playState: PlayState.Playing});
    } else if (this.netInfoType === 'wifi') {
      this.player && this.player.setNativeProps({pause: false});
      this.setState({playState: PlayState.Playing});
    } else {
      this.setState({playState: PlayState.NetError});
    }
  };

  /**
   * 屏幕旋转时，更新RN界面
   */
  handleOrientationChange = evt => {
    const { window, fullscreen } = evt.nativeEvent;
    this.isFullscreen = fullscreen;
    this.screenWidth = window.width;
    this.screenHeight = window.height;

    // RN 界面的动画
    Animated.parallel([
      Animated.timing(this.screenWValue, {
        toValue: window.width,
        duration: 200
      }),
      Animated.timing(this.screenHValue, {
        toValue: window.height,
        duration: 200
      })
    ]).start();
  };

  /**
   * 点击 快进/快退（15s）
   * @param time
   */
  handleSeekStep = time => {
    this.delayDismiss();
    this.player && this.player.setNativeProps({seek: time});
    this.slider && this.slider.updateIndicator((this.state.currentTime + time) / this.state.totalTime);
  };

  /**
   * 点击 播放/暂停
   */
  handlePause = () => {
    const { playState } = this.state;

    this.delayDismiss();
    if (playState === PlayState.Playing) {
      this.setState({ playState: PlayState.Pause });
      this.player.setNativeProps({pause: true});
    } else if (playState !== PlayState.Buffering) {
      this.setState({ playState: PlayState.Playing });
      this.player.setNativeProps({pause: false});
    }
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
    const { value, currentTime, totalTime, playableDuration } = evt.nativeEvent;

    this.slider && this.slider.updateIndicator(value);
    this.slider && this.slider.updateBuffer(playableDuration / totalTime);
    this.setState({ currentTime: currentTime + 1, totalTime });
    this.currentValue = currentTime / totalTime;
    this.bufferValue = playableDuration / totalTime;
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

  /**
   * 拖动slider
   */
  handleSeekingTime = ({value}) => {
    console.log(`Progress: ${value}`);
  };

  /**
   * slider开始获得事件
   */
  handleSeekTimeBegin = () => {
    // 清除工具条消失的计时器
    this.clearDismissTimer();
    // 暂停播放器，销毁原生的计时器
    this.player && this.player.setNativeProps({pause: true});
  };

  /**
   * slider点击、滑动结束
   */
  handleSeekTimeEnd = ({value}) => {
    this.delayDismiss();
    this.player && this.player.setNativeProps({seek: value});
  };

  /**
   * 播放结束
   */
  handlePlayComplete = () => {
    this.setState({playState: PlayState.Stop});
    this.slider && this.slider.updateIndicator(0);
  };

  /**
   * 缓冲状态改变回调
   */
  handelLoadStateDidChange = evt => {
    // loadState === playable/unplayable
    const { loadState } = evt.nativeEvent;
    if (loadState === 'playable') {
      this.setState({playState: PlayState.Playing});
    } else {
      this.setState({playState: PlayState.Buffering});
    }
    console.log(`Load state: ${loadState}`);
  };

  renderBottomBar = () => {
    const { playState } = this.state;
    const pauseText = playState === PlayState.Playing ? '暂停' : '播放';

    const translateY = this.animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [40, 0]
    });
    return (
      <Animated.View style={[styles.bottomBar, {transform: [{translateY}]}]}>
        <View style={styles.seekBtnWrapper}>
          <TouchableOpacity onPress={() => this.handleSeekStep(-15)} style={styles.seekBtn}>
            <Text>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this.handlePause} style={styles.seekBtn}>
            <Text>{pauseText}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => this.handleSeekStep(15)} style={styles.seekBtn}>
            <Text>→</Text>
          </TouchableOpacity>
        </View>
        <PlayerSlider
          ref={r => this.slider = r}
          style={{flex: 1, marginHorizontal: 12}}
          onSeekTimeBegin={this.handleSeekTimeBegin}
          onSeekingTime={this.handleSeekingTime}
          onSeekTimeEnd={this.handleSeekTimeEnd}
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

  renderTimeBottomBar = () => {
    const { currentTime, totalTime} = this.state;
    const translateY = this.animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [40, 0]
    });
    return (
      <Animated.View style={[styles.bottomBar, {transform: [{translateY}]}]}>
        <View style={styles.timeWrapper}>
          <Text style={styles.timeLabel}>{this.formatTimeStr(currentTime)}</Text>
          <Text style={styles.timeLine}>/</Text>
          <Text style={styles.timeLabel}>{this.formatTimeStr(totalTime)}</Text>
        </View>
        <PlayerSlider ref={r => this.slider = r} style={{flex: 1, marginHorizontal: 12}}/>
        <TouchableOpacity onPress={this.handleFullScreen} style={styles.fullScreenBtn} />
      </Animated.View>
    );
  };

  formatTimeStr = time => {
    const minutes = parseInt(time / 60);
    const seconds = parseInt(time % 60);
    return `${minutes < 10 ? 0 : ''}${minutes}:${seconds < 10 ? 0 : ''}${seconds}`
  };

  render() {
    const { style: {height, width}, LoadingComponent, NetErrorComponent, ...rest } = this.props;
    const { playState } = this.state;

    const isNetError = playState === PlayState.NetError;
    const isLoading = playState === PlayState.Buffering;
    const LoadingView = LoadingComponent || <NetLoading coverUrl={this.props.coverUrl} />;
    const NetErrorView = NetErrorComponent || <NetError />;

    return (
      <Animated.View
        style={{overflow: 'hidden', width: this.screenWValue, height: this.screenHValue, backgroundColor: '#ccc'}}
      >
        <MPCPlayer
          ref={r => this.player = r}
          {...rest}
          height={height}
          width={width}
          onLoadStateDidChange={this.handelLoadStateDidChange}
          onOrientationChange={this.handleOrientationChange}
          onChange={this.handleChange}
          onPlayComplete={this.handlePlayComplete}
        />
        <View style={styles.panHandlersView} {...this.panResponder.panHandlers}/>
        {this.renderTopBar()}
        {this.renderBottomBar()}
        {isNetError && NetErrorView}
        {isLoading && LoadingView}
      </Animated.View>
    )
  }
}

const NetLoading = ({ coverUrl }) => {
  return (
    <ImageBackground
      style={[StyleSheet.absoluteFill, {justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent'}]}
      source={{uri: coverUrl}}
    >
      <Text style={{color: '#fff'}}>正常加载中...</Text>
    </ImageBackground>
  )
};

const NetError = () => {
  return (
    <View style={[StyleSheet.absoluteFill, {justifyContent: 'center', alignItems: 'center'}]}>
      <Text>网络出错！</Text>
    </View>
  )
};

