<p align="center">
<a href=https://discourse.pi-hole.net><img src="https://assets.pi-hole.net/static/Vortex_with_text_and_TM.png" width=210></a><br/>
<b>Network-wide ad blocking via your own Linux hardware</b>
</p>

# Web Admin Dashboard

This optional dashboard (based on [almasaeed2010's AdminLTE](https://github.com/almasaeed2010/AdminLTE) Admin Control Panel) allows you to view stats, change settings, and configure your Pi-hole.

![Pi-hole Dashboard](https://assets.pi-hole.net/static/dashboard.png)

There are several ways to [access the dashboard](https://discourse.pi-hole.net/t/how-do-i-access-pi-holes-dashboard-admin-interface/3168):

1. `http://<IP_ADDPRESS_OF_YOUR_PI_HOLE>/admin/`
2. `http:/pi.hole/admin/` (when using Pi-hole as your DNS server)
3. `http://pi.hole/` (when using Pi-hole as your DNS server)

-----

## Pi-hole is free, but powered by your support
There are many reoccuring costs involved with maintaining free, open source and privacy respecting software; expenses which [our volunteers](https://github.com/orgs/pi-hole/people) pitch in to cover out-of-pocket. This is just one example of how strongly we feel about our software, as well as the importance of keeping it maintained.

Make no mistake: **your support is absolutely vital to help keep us innovating!**

### Donations
Sending a donation using our links below is **extremely helpful** in offset a portion of our monthly costs:

- ![Paypal](https://assets.pi-hole.net/static/paypal.png) [Donate via PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=3J2L3Z4DHW9UY)
- ![Bitcoin](https://assets.pi-hole.net/static/Bitcoin.png) Bitcoin Address: 1GKnevUnVaQM2pQieMyeHkpr8DXfkpfAtL

### Alternative support
If you'd rather not donate (_which is okay!_), there are other ways you can help support us:

- [Digital Ocean](http://www.digitalocean.com/?refcode=344d234950e1) affiliate link
- [Vultr](http://www.vultr.com/?ref=7190426) affiliate link
- [UNIXstickers.com](http://unixstickers.refr.cc/jacobs) affiliate link
- [Pi-hole Swag Store](https://pi-hole.net/shop/)
- Spreading the word about our software, and how you have benefited from it

### Contributing via GitHub
We welcome everyone to contribute to issue reports, suggest new features and create pull requests.

If you have something to add - anything from a typo through to a whole new feature, we're happy to check it out! Just make sure to fill out our template when submitting your request; the questions that it asks will help the volunteers quickly understand what you're aiming to achieve.

You'll find that our files have an abundance of comments, which will help you better understand how Pi-hole works. We encourage anyone who likes to tinker to read through it, and submit a pull request for us to review.

### Presentations about Pi-hole
Word-of-mouth continues to help our project grow immensely, and we'd like to help those who are going to be presenting Pi-hole at a conference, meetup or even a school project. If you'd like some free swag to hand out to your audience, [get in touch with us](https://pi-hole.net/2017/05/17/giving-a-presentation-on-pi-hole-contact-us-first-for-some-goodies-and-support/).

-----

## Getting in touch with us
- [Users Forum](https://discourse.pi-hole.net/)
- [Feature requests](https://discourse.pi-hole.net/c/feature-requests?order=votes)
- [FAQs](https://discourse.pi-hole.net/c/faqs)
- [Wiki](https://github.com/pi-hole/pi-hole/wiki)
- [/r/pihole on Reddit](https://www.reddit.com/r/pihole/)
- [@The_Pi_Hole on Twitter](https://twitter.com/The_Pi_Hole)
- [Pi-hole on YouTube](https://www.youtube.com/channel/UCT5kq9w0wSjogzJb81C9U0w)
- [ThePiHole on Facebook](https://www.facebook.com/ThePiHole/)
- [Chat on Gitter](https://gitter.im/pi-hole/pi-hole?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

-----

## Features

### The Query Log
If enabled, the query log will show all of the DNS queries requested by clients using Pi-hole as their DNS server. Forwarded domains will show in green, and blocked (_Pi-holed_) domains will show in red. You can also whitelist or blacklist domains from within this section.

<p align="center">
<img src="https://assets.pi-hole.net/static/query_log.png">
</p>

The query log and graphs are what have helped people [discover all sorts of unexpected traffic traversing their networks](https://pi-hole.net/2017/07/06/round-3-what-really-happens-on-your-network/).

#### Long-term Statistics
Using our FTL API, Pi-hole can store all of the domains queried in a database for retrieval or analysis later on. You can view this data as a graph, individual queries, top clients/advertisers, or even query the database yourself for your own applications.

<p align="center">
<img src="https://assets.pi-hole.net/static/long-term-stats.png">
</p>

### Whitelisting and Blacklisting
Domains can be [whitelisted](https://discourse.pi-hole.net/t/commonly-whitelisted-domains/212) or [blacklisted](https://discourse.pi-hole.net/t/commonly-blacklisted-domains/305) using either the dashboard, or via [the `pihole` command](https://discourse.pi-hole.net/t/the-pihole-command-with-examples/738).

<p align="center">
<a href=https://github.com/pi-hole/pi-hole/wiki/Whitelisting-and-Blacklisting><img src="https://assets.pi-hole.net/static/whitelist.png"></a>
</p>

#### Additional Blocklists
Pi-hole's stock block lists cover over 100,000 known ad-serving domains, which helps ensure you encounter minimal false positives. You can expand the blocking power of your Pi-hole by [adding additional lists](https://discourse.pi-hole.net/t/how-do-i-add-additional-block-lists-to-pi-hole/259) such as the ones found at [The Big Blocklist Collection](https://wally3k.github.io/).

<p align="center">
<a href=https://discourse.pi-hole.net/t/how-do-i-add-additional-block-lists-to-pi-hole/259><img src="https://assets.pi-hole.net/static/manage-ad-lists.png"></a>
</p>

### Enable and Disable Pi-hole
There are times where you may want to disable the blocking functionality, and turn it back on again. You can toggle this via the dashboard or command line.

<p align="center">
<img src="https://assets.pi-hole.net/static/enable-disable.png">
</p>

### Tools

<p align="center">
<img src="https://assets.pi-hole.net/static/tools.png">
</p>

##### Update Ad Lists
This runs [`gravity`](https://github.com/pi-hole/pi-hole/blob/master/gravity.sh) which checks your source list for updates, and downloads if changes are found.

##### Query Ad Lists
You can find out what blocklist a specific domain was found on. This is useful for troubleshooting websites that may not work properly due to a blocked domain.

##### `tail`ing Log Files
You can [watch the log files](https://discourse.pi-hole.net/t/how-do-i-watch-and-interpret-the-pihole-log-file/276) in real time to help debug any issues, or just see what's happening on your network.

##### Pi-hole Debugger
If you are having trouble with your Pi-hole, this is the place to go. You can run the debugger and it will attempt to diagnose any issues, and then link to an FAQ with instructions on rectifying the problem.

<p align="center">
<img src="https://assets.pi-hole.net/static/debug-gui.png">
</p>

If run [via the command line](https://discourse.pi-hole.net/t/the-pihole-command-with-examples/738#debug), you will see coloured text, which makes it easy to identify any problems.

<p align="center">
<a href=https://discourse.pi-hole.net/t/the-pihole-command-with-examples/738#debugs><img src="https://assets.pi-hole.net/static/debug-cli.png"></a>
</p>

After the debugger has finished, you have the option to upload it to our secure server for 48 hours. All you need to do is provide [one of our developers](https://github.com/orgs/pi-hole/teams/debug/members) the unique token generated by the debugger via [one of the various ways of getting in touch with us](#getting-in-touch-with-us).

<p align="center">
<a href=https://discourse.pi-hole.net/t/the-pihole-command-with-examples/738#debugs><img src="https://assets.pi-hole.net/static/debug-token.png"></a>
</p>

You should be able to resolve most issues using the provided FAQ links, but we're always happy to help out if you'd like assistance!

### Web Admin Settings
The settings page lets you control and configure your Pi-hole. You can do things like:

- view networking information
- flush logs or disable the logging of queries
- [enable Pi-hole's built-in DHCP server](https://discourse.pi-hole.net/t/how-do-i-use-pi-holes-built-in-dhcp-server-and-why-would-i-want-to/3026)
- [manage block lists](https://discourse.pi-hole.net/t/how-do-i-add-additional-block-lists-to-pi-hole/259)
- exclude domains from the graphs and enable privacy options
- configure upstream DNS servers
- restart Pi-hole's services
- back up some of Pi-hole's important files
- and more!

<p align="center">
<img src="https://assets.pi-hole.net/static/settings-page.png">
</p>

### Built-in DHCP Server
Pi-hole ships with a [built-in DHCP server](https://discourse.pi-hole.net/t/how-do-i-use-pi-holes-built-in-dhcp-server-and-why-would-i-want-to/3026). This allows you to let your network devices use Pi-hole as their DNS server if your router does not let you adjust the DHCP options.

One nice feature of using Pi-hole's DHCP server if you can set hostnames and DHCP reservations so you'll [see hostnames in the query log instead of IP addresses](https://discourse.pi-hole.net/t/how-do-i-show-hostnames-instead-of-ip-addresses-in-the-dashboard/3530). You can still do this without using Pi-hole's DHCP server; it just takes a little more work. If you do plan to use Pi-hole's DHCP server, be sure to disable DHCP on your router first.

<p align="center">
<a href=https://discourse.pi-hole.net/t/how-do-i-use-pi-holes-built-in-dhcp-server-and-why-would-i-want-to/3026><img src="https://assets.pi-hole.net/static/piholedhcpserver.png"></a>
</p>

-----
<img src="https://assets.pi-hole.net/static/BStackLogo.png" height="80"><br/>
We use BrowserStack for multi-platform multi-browser testing.
