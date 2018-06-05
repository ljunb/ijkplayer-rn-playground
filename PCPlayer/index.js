/**
 * Description : 基于ijkplayer封装的跨端点播播放器
 *
 * Author : cookiej
 * Date   : 2018/6/4
 * Time   : 17:11
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
  NativeModules,
  Dimensions
} from 'react-native';
import PropTypes from 'prop-types';
import PlayerSlider from './PlayerSlider';
import styles from './Player.style';
import DefaultBrightnessLine from "./DefaultBrightnessLine";
import DefaultVolumeLine from "./DefaultVolumeLine";

const PCPlayerManager = NativeModules.PCPlayerManager;
const MPCPlayer = requireNativeComponent('PCPlayer', PCPlayerView);
const SCREEN_WIDTH = Dimensions.get('screen').width;

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
    url: PropTypes.string, // 视频地址
    coverUrl: PropTypes.string, // 视频初始占位图
    height: PropTypes.number, // 视频高度
    width: PropTypes.number, // 视频宽度
    seekStep: PropTypes.number, // 快进/快退间隔，单位秒
    BrightnessComponent: PropTypes.any,
    LoadingComponent: PropTypes.any, //
    NetErrorComponent: PropTypes.any,
    BottomBarComponent: PropTypes.any,
    TopBarComponent: PropTypes.any,
    onSeekStep: PropTypes.func,
    onPlaying: PropTypes.func,
  };

  static defaultProps = {
    height: 300,
    width: SCREEN_WIDTH,
    seekStep: 15
  };

  constructor(props) {
    super(props);
    this.state = {
      playState: PlayState.Idle,
      currentTime: 0,
      totalTime: 0,
    };
    this.screenWValue = new Animated.Value(props.width); // 屏幕翻转时宽度动画值
    this.screenHValue = new Animated.Value(props.height); // 屏幕翻转时高度动画值
    this.toolBarAnimationValue = new Animated.Value(0); // 工具条动画值
    this.brightnessValue = new Animated.Value(0); // 进行手势操作亮度时，控制亮度动画view的透明度
    this.volumeValue = new Animated.Value(0); // 进行手势操作音量时，控制亮度动画view的透明度
    this.currentScreenW = props.width; // 记录屏幕宽度，用于判断手势区域
    this.isShowToolBar = false; // 是否显示工具条
    this.isFullscreen = false; // 是否全屏模式
    this.netInfoType = null; // 网络连接模式
    this.currentValue = 0; // 当前播放进度值
    this.bufferValue = 0; // 当前缓冲进度值
    this.createPanResponder();
  }

  componentDidMount() {
    NetInfo.removeEventListener('connectionChange', this.handleConnectionChange);
    NetInfo.addEventListener('connectionChange', this.handleConnectionChange);
  }

  componentWillUnmount() {
    NetInfo.removeEventListener('connectionChange', this.handleConnectionChange);
  }

  /**
   * 创建手势
   */
  createPanResponder = () => {
    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: this.handleResponderGrant,
      onPanResponderMove: this.handlePanResponderMove,
      onPanResponderRelease: this.handlePanResponderRelease,
    });
  };

  /**
   * 触摸时，显示上下工具条
   */
  handleResponderGrant = () => {
    this.handlePressPlayer();
  };

  /**
   * 在当前播放器上移动手势时
   * @param evt locationX - 触摸点相对于父元素的横坐标
   * @param ges
   * dx - 从触摸操作开始时的累计横向路程
   * dy - 从触摸操作开始时的累计纵向路程
   * moveX - 最近一次移动时的屏幕横坐标
   * moveY - 最近一次移动时的屏幕纵坐标
   */
  handlePanResponderMove = (evt, ges) => {
    const { locationX } = evt.nativeEvent;
    const seekTimeAreaBeginX = 0.25 * this.currentScreenW;

    if (ges.dx === 0 && ges.dy === 0) return;
    if (ges.dx !== 0) {
      // 中间的水平滑动手势，处理快进/快退
      if (locationX >= seekTimeAreaBeginX && locationX <= this.currentScreenW - seekTimeAreaBeginX) {
        const step = ges.moveX / 300 * (ges.dx > 0 ? 1 : -1);
        this.currentValue += step / this.state.totalTime;
        this.currentValue = Math.max(this.currentValue, 0); // 不小于0
        this.currentValue = Math.min(this.currentValue, this.bufferValue); // 不超过缓冲进度
        this.currentValue = Math.min(this.currentValue, 1); // 不大于1

        this.player && this.player.setNativeProps({ seek: this.currentValue });
        this.slider && this.slider.updateIndicator(this.currentValue);
      }
    }
    if (ges.dy !== 0) {
      // 左边区域，亮度调节
      if (locationX <= seekTimeAreaBeginX) {
        const brightness = ges.moveY / 20000 * (ges.dy > 0 ? 1 : -1);
        PCPlayerManager.updateBrightness(brightness);
        this.brightnessValue.setValue(1);
      } else if (locationX >= this.currentScreenW - seekTimeAreaBeginX) {
        // 右边区域，音量调节
        const volume = ges.moveY / 15000 * (ges.dy > 0 ? 1 : -1);
        this.player && this.player.setNativeProps({volume});
        this.volumeValue.setValue(1);
      }
    }
  };

  /**
   * 手势结束，重置动画值
   */
  handlePanResponderRelease = () => {
    this.brightnessValue.setValue(0);
    this.volumeValue.setValue(0);
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
    this.currentScreenW = window.width;

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
  handlePlaying = evt => {
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
    if (this.isShowToolBar) return;
    this.isShowToolBar = true;

    Animated.timing(this.toolBarAnimationValue, {
      toValue: 1
    }).start(this.delayDismiss);
  };

  /**
   * 延迟消失工具条
   */
  delayDismiss = () => {
    this.clearDismissTimer();
    this.delayTimer = setTimeout(() => {
      Animated.timing(this.toolBarAnimationValue, {
        toValue: 0
      }).start(() => {
        this.isShowToolBar = false;
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

    const translateY = this.toolBarAnimationValue.interpolate({
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
    const translateY = this.toolBarAnimationValue.interpolate({
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
    const translateY = this.toolBarAnimationValue.interpolate({
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
  
  get loadingComponent() {
    const { LoadingComponent } = this.props;
    if (React.isValidElement(LoadingComponent)) {
      return LoadingComponent;
    }
    if (Object.prototype.toString.call(LoadingComponent) === '[object Function]') {
      return LoadingComponent();
    }
    return null;
  }

  get errorComponent() {
    const { NetErrorComponent } = this.props;
    if (React.isValidElement(NetErrorComponent)) {
      return NetErrorComponent;
    }
    if (Object.prototype.toString.call(NetErrorComponent) === '[object Function]') {
      return NetErrorComponent();
    }
    return null;
  }

  render() {
    const { height, width, coverUrl, ...rest } = this.props;
    const { playState } = this.state;

    const isNetError = playState === PlayState.NetError;
    const isLoading = playState === PlayState.Buffering;
    const LoadingView = this.loadingComponent || <NetLoading coverUrl={coverUrl} />;
    const NetErrorView = this.errorComponent || <NetError />;

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
          onPlaying={this.handlePlaying}
          onPlayComplete={this.handlePlayComplete}
          onVolumeChange={evt => this.volumeLine && this.volumeLine.updateVolume(evt.nativeEvent.volume)}
          onBrightnessChange={evt => this.brightnessLine && this.brightnessLine.updateBrightness(evt.nativeEvent.brightness)}
        />
        <View style={styles.panHandlersView} {...this.panResponder.panHandlers}/>
        {this.renderTopBar()}
        {this.renderBottomBar()}
        {isNetError && NetErrorView}
        {isLoading && LoadingView}
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: this.brightnessValue, justifyContent: 'center', alignItems: 'center' }]}
          pointerEvents="none"
        >
          <DefaultBrightnessLine ref={r => this.brightnessLine = r}/>
        </Animated.View>
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: this.volumeValue, justifyContent: 'center', alignItems: 'center' }]}
          pointerEvents="none"
        >
          <DefaultVolumeLine ref={r => this.volumeLine = r}/>
        </Animated.View>
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
