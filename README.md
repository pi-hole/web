## About the project

So [project](https://blog.arevindh.com/2017/07/13/add-speedtest-to-pihole-webui/) is just another fun project integrating speedtest to PiHole Web UI.

Note : It’s just a quick solution , nowhere near perfect . If you made it better please let me know [here](https://github.com/arevindh/pihole-speedtest/issues)

It will be using speedtest.net on background for testing. More frequent the speed tests more data will used.

What does this mod have in extra ?

1. Speedtest results of 1/2/4/7/30  days as graph.
2. Custom speed test server selection.
3. Detailed speedtest results page.
4. Ability to schedule speedtest interval.

# By me a coffee 

Buy me a ☕️ if you like my projects :)

https://www.buymeacoffee.com/itsmesid

[Install Instructions](https://github.com/arevindh/pihole-speedtest/wiki/Installing-Speedtest-Mod)

[Update Instructions](https://github.com/arevindh/pihole-speedtest/wiki/Updating--Speedtest-Mod)

## Disclaimer

We are not affiliated or endorced by [Pi-hole](https://github.com/pi-hole/AdminLTE 

## Use Official CLI Mode for best results.

## Inconsistency for python Mode
-------------

This Project is based on speedtest-cli. The text below is from their repository [readme](https://github.com/sivel/speedtest-cli#inconsistency) file.

> It is not a goal of this application to be a reliable latency reporting tool.

> Latency reported by this tool should not be relied on as a value indicative of ICMP
> style latency. It is a relative value used for determining the lowest latency server
> for performing the actual speed test against.

> There is the potential for this tool to report results inconsistent with Speedtest.net.
> There are several concepts to be aware of that factor into the potential inconsistency:

> 1. Speedtest.net has migrated to using pure socket tests instead of HTTP based tests
> 2. This application is written in Python
> 3. Different versions of Python will execute certain parts of the code faster than others
> 4. CPU and Memory capacity and speed will play a large part in inconsistency between
   Speedtest.net and even other machines on the same network

> Issues relating to inconsistencies will be closed as wontfix and without
> additional reason or context.

[Uninstall Instructions](https://github.com/arevindh/pihole-speedtest/wiki/Uninstalling-Speedtest-Mod)
