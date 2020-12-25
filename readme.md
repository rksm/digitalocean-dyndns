Cloned from https://gitlab.no/rune/dyndns/

# Installation with systemd

Modify `dyndns.service`
- change user
- point it to your config
- change directory
- make sure node.js is installed

Copy `dyndns.service` and `dyndns.timer` to `/etc/systemd/system`.
Then `systemctl enable dyndns.timer` and `systemctl start dyndns.timer`.


-----------------------------------------------

# DYNDNS
DYNDNS is a small Node CLI (command line) app that updates DNS records on you Digital Ocean account.

### Installation
Clone this repo with `git clone https://gitlab.no/rune/dyndns.git`. To get your API key, log in to your Digital Ocean account and click the API link at the top of the page. Follow the instructions!  Edit the `config.json` file with your information.

If you don't know your subdomains ID, just fill in the parts with `api_key` and `name`. Install with `npm install -g`. The `name` parameter is the top level domain name, eg. `example.com`.

Then run the app `dyndns --config "/path/to/your/config.json" --list`

Depending on your operating system, the config file and the path to it should be either inside quotation marks or not.

You will get a JSON looking something like this:

    
       { id: 000000, <-- The ID
       type: 'A',
       name: 'YOU SUB DOMAIN',
       data: '127.0.0.1', <-- Current IP
       priority: null,
       port: null,
       ttl: 1800,
       weight: null,
       flags: null,
       tag: null },

Place the value of `id` in the correct place(s) in your `config.json` file.

### Use
As describe above, you use the app by runnig it with parameters. You _HAVE_ to include `--config "/path/to/your/config.json"`. The file can be anywhere on the system, but the user running the app should be able to read the file! You can name the file what you like as well.

To include IPv6 add `-ip6` to the command. eg. `dyndns --config "/path/to/your/config.json" -ip6`

I use it with Cron. My crontab contains the line `0 * * * * dyndns --config "/path/to/your/config.json" -ip6 >/dev/null 2>&1`. This runs the command once an hour with no logging. If you want a log, you can use `0 * * * * dyndns --config "/path/to/your/config.json" -ip6 >> /var/log/dyndns.log`in your crontab. This logs all events and errors to a log file (`dyndns.log`). You can of course name your log file as you wish!  Digital Ocean has a rate limit on 5000 requests per hour.

### Development


