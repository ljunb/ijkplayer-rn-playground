//
//  PCPlayer.m
//  PCPlayerDemo
//
//  Created by CookieJ on 2018/5/30.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "PCPlayer.h"
#import <IJKMediaFramework/IJKMediaFramework.h>

#define SCREEN_W [UIScreen mainScreen].bounds.size.width
#define SCREEN_H [UIScreen mainScreen].bounds.size.height

@interface PCPlayer ()
@property (nonatomic, strong) IJKFFMoviePlayerController *playerVC;
@end

@implementation PCPlayer
{
  NSString *_url;
  NSInteger _width;
  NSInteger _height;
  BOOL _pause;
  BOOL _fullscreen;
  NSTimer *_timer;
  MPVolumeView *_volumeView;
}

- (void)dealloc {
  [_playerVC shutdown];
  _playerVC = nil;
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (instancetype)init {
  if (self = [super init]) {
    [self addNotification];
  }
  return self;
}

- (void)addNotification {
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(statusBarOrientationChange:)
                                               name:UIApplicationDidChangeStatusBarOrientationNotification
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(playerPlaybackStateDidChange:)
                                               name:IJKMPMoviePlayerPlaybackStateDidChangeNotification
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(loadStateDidChange:)
                                               name:IJKMPMoviePlayerLoadStateDidChangeNotification
                                             object:nil];
}

- (void)setUrl:(NSString *)url {
  if ([_url isEqualToString:url]) return;
  
  [_playerVC shutdown];
  _playerVC = nil;
  
  _url = url;
  [self setupPlayer];
}

- (void)setupPlayer {
  if (!_playerVC) {
    IJKFFOptions *options = [IJKFFOptions optionsByDefault];
    [options setOptionIntValue:IJK_AVDISCARD_DEFAULT forKey:@"skip_frame" ofCategory:kIJKFFOptionCategoryCodec];
    [options setOptionIntValue:IJK_AVDISCARD_DEFAULT forKey:@"skip_loop_filter" ofCategory:kIJKFFOptionCategoryCodec];
    [options setOptionIntValue:0 forKey:@"videotoolbox" ofCategory:kIJKFFOptionCategoryPlayer];
    [options setOptionIntValue:60 forKey:@"mx-fps" ofCategory:kIJKFFOptionCategoryPlayer];
    [options setPlayerOptionIntValue:256 forKey:@"vol"];
    
    IJKFFMoviePlayerController *player = [[IJKFFMoviePlayerController alloc] initWithContentURLString:_url withOptions:options];
    [player setScalingMode:IJKMPMovieScalingModeFill];
    player.view.frame = self.bounds;
    [self addSubview:player.view];
    _playerVC = player;
  }
}

- (void)setWidth:(NSInteger)width {
  _width = width;
  if (self.frame.size.width != width) {
    CGRect frame = self.frame;
    frame.size.width = width;
    self.frame = frame;
    self.playerVC.view.frame = frame;
  }
}

- (void)setHeight:(NSInteger)height {
  _height = height;
  if (self.frame.size.height != height) {
    CGRect frame = self.frame;
    frame.size.height = height;
    self.frame = frame;
    self.playerVC.view.frame = frame;
  }
}

- (void)setPause:(BOOL)pause {
  _pause = pause;
  
  if (self.playerVC.isPlaying) {
    [self.playerVC pause];
  } else {
    [self play];
  }
}

- (void)setSeek:(CGFloat)seek {
  // 按15s快进/快退
  if (ABS(seek) == 15) {
    self.playerVC.currentPlaybackTime += seek;
  } else {
    self.playerVC.currentPlaybackTime = seek * self.playerVC.duration;
  }
  if (!self.playerVC.isPlaying) {
    [self play];
  }
  
  NSLog(@"Seek to: %f, duration: %f", self.playerVC.currentPlaybackTime, self.playerVC.duration);
}

- (void)setFullscreen:(BOOL)fullscreen {
  UIInterfaceOrientation orientation = fullscreen ? UIInterfaceOrientationLandscapeRight : UIInterfaceOrientationPortrait;
  [UIView animateWithDuration:0.25 animations:^{
    [[UIDevice currentDevice] setValue:[NSNumber numberWithInt:orientation] forKey:@"orientation"];
  }];
}

- (void)setVolume:(CGFloat)volume {
  CGFloat oldVolume = [self systemVolume];
  [self setSystemVolume:oldVolume - volume];
}

- (void)play {
  if (!self.playerVC.isPreparedToPlay) {
    [self.playerVC prepareToPlay];
  }
  [self.playerVC play];
}

#pragma mark - Notification
- (void)loadStateDidChange:(NSNotification *)notification {
  NSString *loadState;
  if ((self.playerVC.loadState & IJKMPMovieLoadStatePlaythroughOK) != 0
      || (self.playerVC.loadState & IJKMPMovieLoadStatePlayable) != 0) {
    loadState = @"playable";
  } else {
    // 其他两种列入不可播放
    loadState = @"unplayable";
  }
  
  if (self.onLoadStateDidChange) {
    self.onLoadStateDidChange(@{@"loadState": loadState});
  }
}

- (void)playerPlaybackStateDidChange:(NSNotification *)notification {
  if (self.playerVC.playbackState == IJKMPMoviePlaybackStatePlaying) {
    [self setupTimer];
  } else {
    // 清除timer
    [self clearTimer];
    
    if (self.playerVC.playbackState == IJKMPMoviePlaybackStateStopped && self.onPlayComplete) {
      self.onPlayComplete(nil);
    }
  }
}

- (void)statusBarOrientationChange:(NSNotification *)notification {
  UIInterfaceOrientation orientation = [[UIApplication sharedApplication] statusBarOrientation];
  // 全屏
  if (orientation == UIInterfaceOrientationLandscapeRight
      || orientation == UIInterfaceOrientationLandscapeLeft) {
    _fullscreen = YES;
    [UIView animateWithDuration:0.25 animations:^{
      self.frame = CGRectMake(0, 0, SCREEN_W, SCREEN_H);
      self.playerVC.view.frame = CGRectMake(0, 0, SCREEN_W, SCREEN_H);
    }];
  }
  // 复原
  if (orientation == UIInterfaceOrientationPortrait) {
    _fullscreen = NO;
    [UIView animateWithDuration:0.25 animations:^{
      self.frame = CGRectMake(0, 0, _width, _height);
      self.playerVC.view.frame = CGRectMake(0, 0, _width, _height);
    }];
  }
  
  if (self.onOrientationChange) {
    NSDictionary *body = @{
                           @"window": @{
                             @"width": @(_fullscreen ? SCREEN_W : _width),
                             @"height": @(_fullscreen ? SCREEN_H : _height)
                           },
                           @"fullscreen": @(_fullscreen)
                         };
    self.onOrientationChange(body);
  }
}

#pragma mark - Timer
- (void)setupTimer {
  if (!_timer) {
    __weak typeof(self) weakSelf = self;
    _timer = [NSTimer scheduledTimerWithTimeInterval:1 repeats:YES block:^(NSTimer * _Nonnull timer) {
      CGFloat value = weakSelf.playerVC.currentPlaybackTime / weakSelf.playerVC.duration;
      if (weakSelf.onPlaying) {
        NSDictionary *body = @{
                               @"value": @(value),
                               @"currentTime": @(weakSelf.playerVC.currentPlaybackTime),
                               @"totalTime": @(weakSelf.playerVC.duration),
                               @"playableDuration": @(weakSelf.playerVC.playableDuration)
                               };
        weakSelf.onPlaying(body);
      }
      NSLog(@"Timer is keep running...");
    }];
  } else {
    [self clearTimer];
    [self setupTimer];
  }
}

- (void)clearTimer {
  [_timer invalidate];
  _timer = nil;
}

#pragma mark - System Volume Slider
- (UISlider *)getSystemVolumeSlider {
  static UISlider *volumeSlider = nil;
  if (!volumeSlider) {
    MPVolumeView *volumeView = [[MPVolumeView alloc] initWithFrame:CGRectMake(0, 0, 40, 40)];
    volumeView.showsVolumeSlider = NO;
    for (UIView *view in volumeView.subviews) {
      if ([view.class.description isEqualToString:@"MPVolumeSlider"]){
        volumeSlider = (UISlider*)view;
        break;
      }
    }
  }
  return volumeSlider;
}

- (CGFloat)systemVolume {
  return [self getSystemVolumeSlider].value;
}

- (void)setSystemVolume:(CGFloat)volume {
  [self getSystemVolumeSlider].value = volume;
}

@end
