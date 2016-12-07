#### For the main Pi-hole changelog [see here](https://github.com/pi-hole/pi-hole/wiki/Changelog)

#### [1.5] - 2016-12-XX <-- Work in progress, not yet released!
- `[TWEAK]` - Improve speed of getSummaryData() #223
- `[FIX]` - Secure pause resume plus general security fixes #188
- `[TWEAK]` - Keep main diagram updated #216
- `[TWEAK]` - Add additional pagination control above table in "Query Log" #215
- `[TWEAK]` - Add jsonForceObject flag to enable JSON_FORCE_OBJECT #214
- `[FIX]` - Show the main diagram also if log has been flushed during the day #211
- `[NEW]` - Update ad-serving domains from web UI #201
- `[TWEAK]` - Add option to show *all* recent queries at once #195
- `[NEW]` - Add server-side **password protection for the web interface** #197
- `[NEW]` - Provide links in all three tables on the main page to get the corresponding queries #207
- `[NEW]` - Query list of ad-serving domains via Web UI #209
- `[NEW]` - Help Center to the Web UI #208
- `[NEW]` - App-like behavior on mobile devices #203
- `[NEW]` - Increase temporal resolution in main diagram from 1h to 10min #191
- `[TWEAK]` - Skip last datapoint in main diagram #199
- `[NEW]` - Display CPU and I/O utilization (load) #192
- `[NEW]` - Be able to display CPU temperature in Fahrenheit #196
- `[NEW]` - Add possibility to black-/whitelist entries on the Queries page #194
- `[TWEAK]` - Upgrade Chart.js engine from v1.0.1 to v2.3.0 #187
- `[FIX]` - Fix Gravity Count logic #185
- `[TWEAK]` - Add NewVotex SVG with field ID's #180
- `[FIX]` - Stop PHP from crashing if there aren't enough queries to make a graph #181
- `[FIX]` - Make status logo show in all browsers #179

#### [1.4.4.1] - 2016-10-29
- `[FIX]` - Revert a change that stopped the graphs from working!

#### [1.4.4] - 2016-10-29
- `[NEW]` - A button to pause and resume ad-blocking on your network! [#173](https://github.com/pi-hole/AdminLTE/pull/173) ([@tuplink](https://github.com/tuplink))
- `[FIX]` - Further XSS protection on the whitelist/blacklist page. [#172](https://github.com/pi-hole/AdminLTE/pull/172)


#### [1.4.3.1] - 2016-10-18
- `[FIX]` Revert pull[#154](https://github.com/pi-hole/AdminLTE/pull/154), as it is causing loading issues [#171](https://github.com/pi-hole/AdminLTE/pull/171)

#### [1.4.3] - 2016-10-17
- `[TWEAK]` - No longer show the pop up when update is available, it annoys folk. [#164](https://github.com/pi-hole/AdminLTE/pull/164)
- `[FIX]` - Prevent PHP errors by setting default timezone [#154](https://github.com/pi-hole/AdminLTE/pull/154) (@das7pad)
- `[TWEAK]` - Make arrays backward compatible with PHP 5.3 [#158](https://github.com/pi-hole/AdminLTE/pull/158) (@bcambl)
- `[PERF]` - Performance enhancements in the log parsing [#156](https://github.com/pi-hole/AdminLTE/pull/156) (@akoebbe)
- `[FIX]` - An issue where gravity count was double the actual number [#167](https://github.com/pi-hole/AdminLTE/pull/167)
- `[NEW]` - Add hostname to `Forwarding Destinations` chart if it is found in `/etc/hosts` [#168](https://github.com/pi-hole/AdminLTE/pull/168)
- `[FIX]` - PHP 5.3 support [#160](https://github.com/pi-hole/AdminLTE/pull/160)

#### [1.4.2] - 2016-10-01
- `[FIX]` - Single digit dates not longer cause issues with log parsing... [#151](https://github.com/pi-hole/AdminLTE/pull/151)

#### [1.4.1] - 2016-09-24
- `[FIX]` - Fix temperature output on various devices [#129](https://github.com/pi-hole/AdminLTE/pull/129) (@Fourdee)
- `[TWEAK]` - Remove `pi.hole` and `hostname` entries from web stats for more accurate results. [#134](https://github.com/pi-hole/AdminLTE/pull/134)
- `[TWEAK]` - apple-touch-icon is now png [#139](https://github.com/pi-hole/AdminLTE/pull/139) (@JdenHartog)
- `[FIX]` - Fix for PHP errors in lighttpd error log. [#141](https://github.com/pi-hole/AdminLTE/pull/141)
- `[TWEAK`] - Updated URL and fixed the text styling of GitHub [#135](https://github.com/pi-hole/AdminLTE/pull/135) (@rappo)

#### [1.4] - 2016-08-19
- `[NEW]` - Add CPU temp to status header. The icon becomes red with temps > 45C. [#106](../pull/106)
- `[NEW]` - Log white/blacklist failures. Also allow for a custom hostname to be used to white/blacklist. [#108](../pull/108)
- `[FIX]` - Make tables responsive (query log, top clients, etc). [#111](../pull/111) [#119](../pull/119)
- `[FIX]` - Fix how we handle CORS. Also allow localhost to white/blacklist domains. [#112](../pull/112)
- `[FIX]` - Fix possible XSS attacks through white/blacklist. [#120](../pull/120) [#124](../pull/124)
- `[FIX]` - Fix possible access to unauthorized files through `php/get.php` [#123](../pull/123)
- `[MOD]` - Slight changes to how we get the versions in the footer. [#104](../pull/104)
- `[MOD]` - Change logo to the new one! [#125](../pull/125)

#### [1.3] - 2016-06-11
- `[NEW]` - Whitelist/Blacklist interface! Requires the latest version (currently unreleased) of Pi-hole. [#88](../pull/88)
- `[NEW]` - Added update prompt because of the new functionality [3f66e9](https://github.com/pi-hole/AdminLTE/commit/3f66e9015ab73dadf5cb8f07f3aa3fe30d678fbe)
- `[NEW]` - Implement CSP, move JS out of main HTML, and remove Paypal tracking pixel [#89](../pull/89)
- `[NEW]` - Add update notifications for Pi-hole and the web interface [#92](../pull/92)
- `[FIX]` - Fix XSS bug in hosts list [#84](../pull/84)
- `[FIX]` - Split lines in `/etc/hosts` at any whitespace, not just tabs [#85](../pull/85)
- `[FIX]` - Add `bootstrap.min.css.map` to appease the demands of the dev console [#87](../pull/87)
- `[MOD]` - Add mobile support to the JS disabled alert [#94](../pull/94)

#### [1.2] - 2016-04-16
- `[TWEAK]` - Animations are now turned off, after many requests. Toggle to come in future. [#75](../pull/75)
- `[FIX]` - Status icon actually means something now. Monitors if `dnsmasq` is running. [#71](../pull/71)
- `[FIX]` - Fix for High CPU usage caused by "PHP Warning" flooding the journal[#69](../pull/69)
- `[FIX]` - Query Log page no longer falls over when you have a high number of blocked domains (e.g Mahakala list) [#74](../pull/74) (fixes [#73](../issues/73))
- `[FIX]` - `/etc/pihole/gravity.list` and `-` are no longer shown in Top Ads list
- `[TWEAK]` - Moved away from the ugly radar chart for top clients (it got messy when there were a lot of clients), instead, they're now displayed as a list. 
- `[NEW]` - Hostnames can now be displayed! This needs to be set up manually, however, all you need to do is add your clients to `/etc/hosts` (if they're not already) like so `192.168.x.x <hostname>` (separated by a tab) [#78](../pull/78)


#### [1.1.7] - 2016-03-31
##### Bugfixes
- The stats should load faster now, as we are now only loading needed files once instead of four times! [#64](https://github.com/pi-hole/AdminLTE/pull/64)

#### [1.1.6] - 2016-03-23
##### Added
- Popup when you have Javascript disabled. Without Javascript, the interface will not fully work [#48](https://github.com/pi-hole/AdminLTE/pull/48)
- Query Log now shows whether the domain was blocked [#58](https://github.com/pi-hole/AdminLTE/pull/58)

##### Bugfixes
- Graph tooltip had wrong color for total queries [#50](https://github.com/pi-hole/AdminLTE/pull/50)
- Query Log should actually work now [#62](https://github.com/pi-hole/AdminLTE/pull/62)
- Fix divide by zero [#55](https://github.com/pi-hole/AdminLTE/issues/55)
- Fixed Query Type graph tooltip [#54](https://github.com/pi-hole/AdminLTE/issues/54)

##### Misc
- Changed graph colors to match top boxes. [#50](https://github.com/pi-hole/AdminLTE/pull/50)
- Improved domain checking time [#59](https://github.com/pi-hole/AdminLTE/pull/59)

#### [1.1.5] - 2016-03-07
##### Bugfixes
- Fixed Query Log failing to refresh [4f20cc6](https://github.com/pi-hole/AdminLTE/commit/4f20cc6627148d77f678455876f34eb9a49575b6)

#### [1.1.4] - 2016-03-02
##### Bugfixes
- Fixed Query Log showing weird values [725d0de](https://github.com/pi-hole/AdminLTE/commit/725d0de52af7fcbc159afebcd86fc8d6a8a75a3c)

#### [1.1.3] - 2016-02-23
##### Bugfixes
- Removed hardcoded "GMT" timezone from `date_create()` calls. Resolves [issue brought up on reddit](https://us.reddit.com/r/pihole/comments/46xd49/pihole_253_released/d0awwe5)

#### [1.1.2] - 2016-02-22
##### Bugfixes
- api.php now returns summary when called without params [#342](https://github.com/pi-hole/pi-hole/issues/342)

#### [1.1.1] - 2016-02-21
##### Bugfixes
- Fixed images in Query Log not displaying

#### [1.1.0] - 2016-02-21
##### Added
- Charts on the main page (Ads vs Total, etc) [#25](https://github.com/pi-hole/AdminLTE/pull/25)
- Query-log in sidebar [#25](https://github.com/pi-hole/AdminLTE/pull/25)
- More stats in api.php [#25](https://github.com/pi-hole/AdminLTE/pull/25)
- Special theme coloring for Android and IOS browsers [#35](https://github.com/pi-hole/AdminLTE/pull/35)

##### Removed
- Coinbase donation link [#33](https://github.com/pi-hole/AdminLTE/pull/33)
- "More Info" buttons [#25](https://github.com/pi-hole/AdminLTE/pull/25)

##### Bugfixes
- Loads all needed files from local storage [#41](https://github.com/pi-hole/AdminLTE/pull/41)
- Fixed slowdown caused by animations on mobile devices [#38](https://github.com/pi-hole/AdminLTE/pull/38)

##### Misc
- Modified upper right info popup [#36](https://github.com/pi-hole/AdminLTE/pull/36)

#### [1.0.0] - 2016-01-31
Initial version after splitting off of the main repo's version system
