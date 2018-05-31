//
//  PCPlayer.m
//  PCPlayerDemo
//
//  Created by CookieJ on 2018/5/30.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "PCPlayer.h"
#import <IJKMediaFramework/IJKMediaFramework.h>
#import "UIView+FindUIViewController.h"

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
}

- (void)dealloc {
  [_playerVC pause];
  [_playerVC stop];
  [_playerVC shutdown];
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
}

- (void)setUrl:(NSString *)url {
  if ([_url isEqualToString:url]) return;
  
  [_playerVC pause];
  [_playerVC stop];
  [_playerVC shutdown];
  
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
    [player prepareToPlay];
    [self addSubview:player.view];
    _playerVC = player;
  }
}

- (void)setWidth:(NSInteger)width {
  _width = width;
  if (self.bounds.size.width != width) {
    CGRect frame = self.frame;
    frame.size.width = width;
    self.frame = frame;
    self.playerVC.view.frame = frame;
  }
}

- (void)setHeight:(NSInteger)height {
  _height = height;
  if (self.bounds.size.height != height) {
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
    [self.playerVC play];
  }
}

- (void)setSeek:(float)seek {
  if (ABS(seek) == 15) {
    self.playerVC.currentPlaybackTime = self.playerVC.currentPlaybackTime + seek;
  } else {
    self.playerVC.currentPlaybackTime = seek * self.playerVC.duration;
  }
  NSLog(@"Seek to: %f, duration: %f", self.playerVC.currentPlaybackTime, self.playerVC.duration);
}

- (void)setFullscreen:(BOOL)fullscreen {
  if (fullscreen) {//小屏->全屏
    [UIView animateWithDuration:0.25 animations:^{
      NSNumber * value  = [NSNumber numberWithInt:UIInterfaceOrientationLandscapeRight];
      [[UIDevice currentDevice] setValue:value forKey:@"orientation"];
    }];
  }else{//全屏->小屏
    [UIView animateWithDuration:0.25 animations:^{
      NSNumber * value  = [NSNumber numberWithInt:UIInterfaceOrientationPortrait];
      [[UIDevice currentDevice] setValue:value forKey:@"orientation"];
    }];
  }
}

#pragma mark - Notification
- (void)statusBarOrientationChange:(NSNotification *)notification {
  UIInterfaceOrientation orientation = [[UIApplication sharedApplication] statusBarOrientation];
  if (orientation == UIInterfaceOrientationLandscapeRight || orientation == UIInterfaceOrientationLandscapeLeft) {
    _fullscreen = YES;
    [UIView animateWithDuration:0.25 animations:^{
      self.frame = CGRectMake(0, 0, SCREEN_W, SCREEN_H);
      self.playerVC.view.frame = CGRectMake(0, 0, SCREEN_W, SCREEN_H);
    }];
  }
  if (orientation == UIInterfaceOrientationPortrait) {
    _fullscreen = NO;
    [UIView animateWithDuration:0.25 animations:^{
      self.frame = CGRectMake(0, 0, _width, _height);
      self.playerVC.view.frame = CGRectMake(0, 0, _width, _height);
    }];
  }
  
  if (self.onOrientationChange) {
    NSDictionary *body = @{
                           @"window": @{ @"width": @(_fullscreen ? SCREEN_W : _width), @"height": @(_fullscreen ? SCREEN_H : _height)},
                           @"fullscreen": @(_fullscreen)
                           };
    self.onOrientationChange(body);
  }
}

@end
