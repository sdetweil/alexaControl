// there are two actions
//   0 = off
//   1 = on

// the context has capabilites you can interact with
// 
// Focus    change(new_focus value)
//          get, returns the current focus setting
//
//			focus can be used in a plugin for visibility, typically when plugin needs full screen
//			known focus values
//			default
//			sleep
//			timer
//			map
//			dilbert
//			sc  = soundcloud
//			xkcd
//			gif
//			todoist
//			video
//			reminders
//
// 
// AutoSleepService
//			sleep  -- go to sleep
//			wake   -- wake up
//

if(action ==1) 
   this.context.Focus.change('map');
else
   this.context.Focus.change('default');