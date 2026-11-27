/* Meridian: the curriculum. Vee starts with five commands and learns 3 to 5 more each level.
   Each entry: c = the label, k = the first word that counts as the right command ('*' = any, when a pattern matters more),
   n = a pattern the answer must contain (for techniques), l = what it does, fx = its Shell bonus,
   w = problems a bug can bring: [the problem, [accepted answers; the first is shown when you miss]]. */
window.MeridianCommands = [
  /* ---- the first five ---- */
  { c: 'whoami', l: 'Shows which account you are running as.', fx: 'multi2', w: [
    ['You are logged in, but not sure which account you are using.', ['whoami']],
    ['Before you touch anything on this box, confirm which user you are.', ['whoami']],
    ['A script fails with permission errors. Check which user it runs as.', ['whoami']]] },
  { c: 'pwd', l: 'Prints the directory you are standing in.', fx: 'focus', w: [
    ['You have changed directories five times and lost track of where you are.', ['pwd']],
    ['You need the full path of this folder to paste into a config file.', ['pwd']]] },
  { c: 'ls', l: 'Lists what is inside a directory.', fx: 'multi3', w: [
    ['You need to see which files are in this directory.', ['ls']],
    ['List the contents of the logs folder.', ['ls logs', 'ls logs/']]] },
  { c: 'cd', l: 'Moves you into another directory.', fx: 'expose', w: [
    ['Move into the projects folder.', ['cd projects', 'cd projects/']],
    ['Change into /var/log to read the system logs.', ['cd /var/log', 'cd /var/log/']],
    ['Jump straight to your home directory.', ['cd', 'cd ~']]] },
  { c: 'cat', l: 'Prints a file’s contents to the screen.', fx: 'heal', w: [
    ['Read what is inside config.txt without opening an editor.', ['cat config.txt']],
    ['Check what is in /etc/hostname.', ['cat /etc/hostname']]] },

  /* ---- level 2 ---- */
  { c: 'cd ..', k: 'cd', n: '\\.\\.', l: 'Goes up one directory. Two dots always mean “the folder above.”', fx: 'slow', w: [
    ['You went one folder too deep. Go back up one level.', ['cd ..']],
    ['Climb up two directories at once.', ['cd ../..']]] },
  { c: 'ls -a', k: 'ls', n: '-\\w*a', l: 'Lists hidden files too: anything whose name starts with a dot.', fx: 'expose', w: [
    ['Something is hiding in this folder. Show hidden files too.', ['ls -a', 'ls -la', 'ls -al']],
    ['Check whether this project has a .env file.', ['ls -a', 'ls -la', 'ls -al']]] },
  { c: 'mkdir', l: 'Creates a new directory. Vee builds a wall: incoming damage is halved this round.', fx: 'guard', w: [
    ['Create a new folder called backups.', ['mkdir backups']],
    ['Make a directory named reports.', ['mkdir reports']]] },
  { c: 'touch', l: 'Creates an empty file, or updates a file’s timestamp.', fx: 'multi2', w: [
    ['Create an empty file called todo.txt.', ['touch todo.txt']],
    ['Make a blank index.html to start a new page.', ['touch index.html']]] },
  { c: 'echo', l: 'Prints text. Paired with > it writes text into files.', fx: 'multi2', w: [
    ['Print the words hello world.', ['echo hello world', 'echo "hello world"', "echo 'hello world'"]],
    ['Show the value of your HOME variable.', ['echo $HOME']]] },

  /* ---- level 3 ---- */
  { c: 'cp', l: 'Copies a file.', fx: 'multi2', w: [
    ['Make a backup copy of config.txt called config.bak.', ['cp config.txt config.bak']],
    ['Copy report.pdf into the shared folder.', ['cp report.pdf shared', 'cp report.pdf shared/']]] },
  { c: 'mv', l: 'Moves or renames files.', fx: 'stun', w: [
    ['Move report.txt into the archive folder.', ['mv report.txt archive', 'mv report.txt archive/']],
    ['Rename draft.md to final.md.', ['mv draft.md final.md']]] },
  { c: 'rm', l: 'Deletes files. There is no trash can.', fx: 'heavy', w: [
    ['Delete the file old.txt.', ['rm old.txt']],
    ['Remove every .tmp file in this folder.', ['rm *.tmp']]] },

  /* ---- level 4 ---- */
  { c: 'ls -l', k: 'ls', n: '-\\w*l', l: 'The long listing: permissions, owner, size and date for every file.', fx: 'crit', w: [
    ['Show file sizes and permissions in a long list.', ['ls -l', 'ls -la', 'ls -al', 'ls -lh']],
    ['Show sizes in human-readable units, long format.', ['ls -lh', 'ls -hl']]] },
  { c: 'head', l: 'Shows the first lines of a file.', fx: 'focus', w: [
    ['Peek at the first ten lines of data.csv.', ['head data.csv', 'head -n 10 data.csv']],
    ['See the header row of users.csv.', ['head -n 1 users.csv', 'head -1 users.csv']]] },
  { c: 'tail', l: 'Shows the last lines of a file.', fx: 'multi2', w: [
    ['Show only the last ten lines of error.log.', ['tail error.log', 'tail -n 10 error.log']],
    ['Show the last 50 lines of access.log.', ['tail -n 50 access.log', 'tail -50 access.log']]] },
  { c: 'less', l: 'Opens a file one screen at a time. Q quits.', fx: 'slow', w: [
    ['syslog is huge. Scroll through it one page at a time.', ['less syslog', 'less /var/log/syslog']],
    ['Read the long README.md without it flying past.', ['less README.md']]] },

  /* ---- level 5 ---- */
  { c: 'grep', l: 'Searches text for a pattern.', fx: 'expose', w: [
    ['Find every line that contains ERROR in app.log.', ['grep ERROR app.log', 'grep "ERROR" app.log', "grep 'ERROR' app.log"]],
    ['Search config.yml for the word timeout.', ['grep timeout config.yml']]] },
  { c: 'mkdir -p', k: 'mkdir', n: '-p', l: 'Creates a whole path of folders at once, parents included.', fx: 'guard', w: [
    ['Create the nested folders site/assets/img in one go.', ['mkdir -p site/assets/img']],
    ['Make backups/2026/november, even though none of it exists yet.', ['mkdir -p backups/2026/november']]] },
  { c: 'rm -r', k: 'rm', n: '-\\w*r', l: 'Deletes a folder and everything in it. Read it twice before pressing Enter.', fx: 'heavy', w: [
    ['Delete the cache folder and everything inside it.', ['rm -r cache', 'rm -rf cache', 'rm -r cache/', 'rm -rf cache/']],
    ['Remove the old_build directory completely.', ['rm -r old_build', 'rm -rf old_build']]] },
  { c: 'cp -r', k: 'cp', n: '-\\w*[rR]', l: 'Copies a whole folder, not just one file.', fx: 'multi3', w: [
    ['Copy the whole photos folder to photos_old.', ['cp -r photos photos_old', 'cp -R photos photos_old']],
    ['Back up the site folder to site_backup.', ['cp -r site site_backup', 'cp -R site site_backup']]] },
  { c: 'history', l: 'Lists the commands you’ve run before.', fx: 'focus', w: [
    ['What was that command you ran yesterday? Show your command history.', ['history']],
    ['Show your recent commands and search them for ssh.', ['history | grep ssh']]] },

  /* ---- level 6 ---- */
  { c: '> (write)', k: '*', n: '[^>]>[^>]', l: 'Sends a command’s output into a file, replacing what was there.', fx: 'leak', w: [
    ['Save the words hello into a new file called note.txt.', ['echo hello > note.txt']],
    ['Save the list of files here into files.txt.', ['ls > files.txt']]] },
  { c: '>> (append)', k: '*', n: '>>', l: 'Adds output to the end of a file instead of replacing it.', fx: 'leak', w: [
    ['Add the line done to the end of log.txt without erasing it.', ['echo done >> log.txt']],
    ['Append today’s date to journal.txt.', ['date >> journal.txt']]] },
  { c: '| (pipe)', k: '*', n: '\\|', l: 'Feeds one command’s output into another. The most useful character on the keyboard.', fx: 'multi3', w: [
    ['Count how many files are in this folder: list them, then count the lines.', ['ls | wc -l']],
    ['Show only the error lines from dmesg.', ['dmesg | grep error', 'dmesg | grep -i error']]] },

  /* ---- level 7 ---- */
  { c: 'chmod', l: 'Changes file permissions. It locks a bug in place.', fx: 'stun', w: [
    ['Remove write permission for everyone else on notes.md.', ['chmod go-w notes.md', 'chmod o-w notes.md']],
    ['Give the owner execute permission on build.sh.', ['chmod u+x build.sh', 'chmod +x build.sh']]] },
  { c: 'chmod +x', k: 'chmod', n: '\\+x', l: 'Makes a file executable, so you can run it.', fx: 'stun', w: [
    ['deploy.sh will not run: permission denied. Make it executable.', ['chmod +x deploy.sh', 'chmod u+x deploy.sh']],
    ['Make the script backup.sh runnable.', ['chmod +x backup.sh', 'chmod u+x backup.sh']]] },
  { c: 'chown', l: 'Changes who owns a file.', fx: 'stun', w: [
    ['Make the user vee the owner of site.conf.', ['chown vee site.conf']],
    ['Give the www folder and everything in it to the user web.', ['chown -R web www']]] },
  { c: 'sudo', l: 'Runs one command as an administrator. It hits every bug at once.', fx: 'all', w: [
    ['Restart the nginx service. It needs root.', ['sudo systemctl restart nginx']],
    ['Editing /etc/hosts needs root. Open it in nano.', ['sudo nano /etc/hosts']]] },

  /* ---- level 8 ---- */
  { c: 'ps', l: 'Lists running processes.', fx: 'slow', w: [
    ['Something is eating the CPU. See which processes are running.', ['ps aux', 'ps -ef', 'ps']],
    ['List every process on the machine, from every user.', ['ps aux', 'ps -ef', 'ps -e']]] },
  { c: 'kill', l: 'Asks a process to stop, by its PID.', fx: 'heavy', w: [
    ['A frozen program has PID 4821. End it.', ['kill 4821']],
    ['A runaway process, PID 3107, is flooding the logs. Stop it.', ['kill 3107']]] },
  { c: 'kill -9', k: 'kill', n: '-(9|KILL)', l: 'Forces a process to stop when it ignores a polite kill.', fx: 'heavy', w: [
    ['Process 990 ignores a normal kill. Force it to stop.', ['kill -9 990', 'kill -KILL 990']],
    ['PID 77 is stuck. Kill it with no chance to argue.', ['kill -9 77', 'kill -KILL 77']]] },
  { c: 'top', l: 'Shows live CPU and memory use, refreshing as you watch.', fx: 'slow', w: [
    ['Watch which process uses the most CPU, live.', ['top', 'htop']],
    ['The server feels slow. Open a live view of its load.', ['top', 'htop']]] },
  { c: 'ps aux | grep', k: 'ps', n: '\\|\\s*grep', l: 'Finds one process in the whole list. You will type this a thousand times.', fx: 'expose', w: [
    ['Check whether nginx is running.', ['ps aux | grep nginx', 'ps -ef | grep nginx']],
    ['Find the PID of the python process.', ['ps aux | grep python', 'ps -ef | grep python']]] },

  /* ---- level 9 ---- */
  { c: 'df', l: 'Shows free disk space.', fx: 'leak', w: [
    ['The server says the disk is full. Check how much space is left.', ['df -h', 'df']],
    ['Show free space on every drive in human-readable sizes.', ['df -h']]] },
  { c: 'du', l: 'Shows how much space files and folders use.', fx: 'leak', w: [
    ['How big is the logs folder, in human-readable units?', ['du -sh logs', 'du -sh logs/']],
    ['Show the size of each folder here.', ['du -sh *', 'du -h --max-depth=1', 'du -sh ./*']]] },
  { c: 'man', l: 'Opens the manual for any command. The answer is usually in here.', fx: 'heal', w: [
    ['You forgot what the flags for tar do. Read its manual.', ['man tar']],
    ['Look up how grep works, from the source.', ['man grep']]] },

  /* ---- level 10 ---- */
  { c: 'find', l: 'Searches for files by name, size or age.', fx: 'crit', w: [
    ['List the files in /tmp changed in the last day.', ['find /tmp -mtime -1']],
    ['Find every file bigger than 1 GB under /var.', ['find /var -size +1G', 'find /var -type f -size +1G']]] },
  { c: 'find -name', k: 'find', n: '-i?name', l: 'Finds files by their name, anywhere below a folder.', fx: 'crit', w: [
    ['Somewhere under this folder is budget.xlsx. Find it.', ['find . -name budget.xlsx', 'find -name budget.xlsx']],
    ['Find every .jpg under photos.', ['find photos -name "*.jpg"', "find photos -name '*.jpg'", 'find photos -name *.jpg']]] },
  { c: 'grep -r', k: 'grep', n: '-\\w*[rR]', l: 'Searches every file in a folder and everything below it.', fx: 'expose', w: [
    ['Search every file in this folder for TODO.', ['grep -r TODO .', 'grep -r TODO', 'grep -rn TODO .', 'grep -R TODO .']],
    ['Find which config file under /etc mentions port 8080.', ['grep -r 8080 /etc', 'grep -rn 8080 /etc']]] },
  { c: 'grep -i', k: 'grep', n: '-\\w*i', l: 'Searches without caring about upper or lower case.', fx: 'expose', w: [
    ['Find “error” in app.log, whether it is written Error, ERROR or error.', ['grep -i error app.log']],
    ['Search names.txt for vee in any capitalization.', ['grep -i vee names.txt']]] },

  /* ---- level 11 ---- */
  { c: 'tail -f', k: 'tail', n: '-f', l: 'Follows a file as it grows. The way you watch logs live.', fx: 'multi2', w: [
    ['Watch the newest lines of server.log as they are written.', ['tail -f server.log']],
    ['Keep /var/log/auth.log open and watch logins happen.', ['tail -f /var/log/auth.log']]] },
  { c: 'head -n', k: 'head', n: '-n\\s*\\d+|-\\d+', l: 'Shows exactly as many lines as you ask for.', fx: 'focus', w: [
    ['Show the first 5 lines of list.txt.', ['head -n 5 list.txt', 'head -5 list.txt']],
    ['Show the first 20 lines of data.csv.', ['head -n 20 data.csv', 'head -20 data.csv']]] },
  { c: 'wc', l: 'Counts lines, words and characters.', fx: 'multi2', w: [
    ['How many lines are in users.txt?', ['wc -l users.txt']],
    ['Count the words in essay.txt.', ['wc -w essay.txt']]] },
  { c: 'sort', l: 'Sorts lines.', fx: 'multi2', w: [
    ['Put the lines of names.txt in alphabetical order.', ['sort names.txt']],
    ['Sort scores.txt by number, highest first.', ['sort -nr scores.txt', 'sort -rn scores.txt']]] },
  { c: 'uniq', l: 'Removes repeated lines that sit next to each other. Usually after sort.', fx: 'multi2', w: [
    ['Show each IP in ips.txt only once.', ['sort ips.txt | uniq', 'sort -u ips.txt']],
    ['Count how many times each line appears in visits.txt.', ['sort visits.txt | uniq -c']]] },

  /* ---- level 12 ---- */
  { c: 'tar', l: 'Bundles files into one archive, or unpacks one. It hits every bug.', fx: 'all', w: [
    ['List what is inside backup.tar without unpacking it.', ['tar -tf backup.tar', 'tar tf backup.tar']],
    ['Bundle the notes folder into notes.tar.', ['tar -cf notes.tar notes', 'tar cf notes.tar notes']]] },
  { c: 'tar -czf', k: 'tar', n: '-?c\\w*z|-?z\\w*c', l: 'Creates a compressed .tar.gz archive.', fx: 'all', w: [
    ['Pack the project folder into project.tar.gz.', ['tar -czf project.tar.gz project', 'tar czf project.tar.gz project', 'tar -czvf project.tar.gz project']],
    ['Compress logs into logs.tar.gz.', ['tar -czf logs.tar.gz logs', 'tar czf logs.tar.gz logs']]] },
  { c: 'tar -xzf', k: 'tar', n: '-?x', l: 'Unpacks a .tar.gz archive.', fx: 'all', w: [
    ['Unpack backup.tar.gz here.', ['tar -xzf backup.tar.gz', 'tar xzf backup.tar.gz', 'tar -xzvf backup.tar.gz', 'tar -xf backup.tar.gz']],
    ['Extract site.tar.gz.', ['tar -xzf site.tar.gz', 'tar xzf site.tar.gz', 'tar -xf site.tar.gz']]] },

  /* ---- level 13 ---- */
  { c: 'ssh', l: 'Logs into another machine securely.', fx: 'crit', w: [
    ['Log into the server at 10.0.0.5.', ['ssh 10.0.0.5']],
    ['Log into backup.local as the user admin.', ['ssh admin@backup.local']],
    ['Connect to 10.0.0.9 on port 2222.', ['ssh -p 2222 10.0.0.9']]] },
  { c: 'scp', l: 'Copies files to or from another machine over ssh.', fx: 'multi2', w: [
    ['Copy notes.txt to your home folder on school.local.', ['scp notes.txt vee@school.local:~', 'scp notes.txt vee@school.local:', 'scp notes.txt school.local:~']],
    ['Download /var/log/app.log from server.local into this folder.', ['scp server.local:/var/log/app.log .', 'scp vee@server.local:/var/log/app.log .']]] },
  { c: 'ping', l: 'Checks whether another machine answers.', fx: 'slow', w: [
    ['Is the router at 192.168.1.1 even reachable?', ['ping 192.168.1.1', 'ping -c 4 192.168.1.1']],
    ['Send exactly three pings to meridian.local.', ['ping -c 3 meridian.local']]] },
  { c: 'ip', l: 'Shows and changes network settings.', fx: 'expose', w: [
    ['What IP address does this machine have?', ['ip a', 'ip addr', 'ip address', 'ip addr show']],
    ['Show the routing table.', ['ip route', 'ip r']]] },

  /* ---- level 14 ---- */
  { c: 'curl', l: 'Talks to web servers from the terminal.', fx: 'multi3', w: [
    ['Fetch the page at http://meridian.local and print it.', ['curl http://meridian.local']],
    ['Check only the response headers of https://upstream.net.', ['curl -I https://upstream.net', 'curl --head https://upstream.net']]] },
  { c: 'wget', l: 'Downloads a file from the web.', fx: 'multi2', w: [
    ['Download https://meridian.local/map.zip.', ['wget https://meridian.local/map.zip']],
    ['Grab the installer at http://get.local/setup.sh.', ['wget http://get.local/setup.sh']]] },
  { c: 'apt', l: 'Installs and updates software on Debian and Ubuntu systems. Usually needs sudo.', fx: 'all', w: [
    ['Install curl.', ['sudo apt install curl', 'apt install curl', 'sudo apt-get install curl']],
    ['Refresh the list of available packages.', ['sudo apt update', 'apt update', 'sudo apt-get update']]] },
  { c: 'systemctl', l: 'Starts, stops and checks services.', fx: 'stun', w: [
    ['Is nginx running? Check its status.', ['systemctl status nginx', 'sudo systemctl status nginx']],
    ['Make ssh start automatically at boot.', ['sudo systemctl enable ssh', 'systemctl enable ssh', 'sudo systemctl enable sshd']]] },
  { c: 'journalctl', l: 'Reads the system’s logs, including each service’s.', fx: 'expose', w: [
    ['Read the logs for the nginx service.', ['journalctl -u nginx', 'sudo journalctl -u nginx']],
    ['Follow the system log live.', ['journalctl -f', 'sudo journalctl -f']]] },

  /* ---- level 15 ---- */
  { c: 'chmod 755', k: 'chmod', n: '\\b[0-7]{3}\\b', l: 'Sets permissions with numbers: 7 is read+write+execute, 5 is read+execute, 4 is read.', fx: 'stun', w: [
    ['Set run.sh so you can do anything and everyone else can read and run it.', ['chmod 755 run.sh']],
    ['Set page.html so you can read and write, everyone else only read.', ['chmod 644 page.html']]] },
  { c: 'chmod 600', k: 'chmod', n: '\\b600\\b', l: 'Locks a file so only its owner can read and write it. Use it for keys and secrets.', fx: 'stun', w: [
    ['Lock secrets.txt so only you can read and write it.', ['chmod 600 secrets.txt']],
    ['ssh refuses your key: id_rsa is too open. Fix it.', ['chmod 600 id_rsa', 'chmod 600 ~/.ssh/id_rsa']]] },
  { c: 'id', l: 'Shows your user ID and every group you belong to.', fx: 'expose', w: [
    ['Which groups is your account in, with their IDs?', ['id']],
    ['Check the user and group IDs of the account web.', ['id web']]] },

  /* ---- level 16 ---- */
  { c: 'groups', l: 'Lists the groups a user belongs to.', fx: 'focus', w: [
    ['Which groups are you in?', ['groups']],
    ['Is the user web in the www-data group? List its groups.', ['groups web']]] },
  { c: 'useradd', l: 'Creates a new user account.', fx: 'guard', w: [
    ['Create an account named juno, with a home folder.', ['sudo useradd -m juno', 'useradd -m juno', 'sudo adduser juno']],
    ['Add a user called pell.', ['sudo useradd pell', 'useradd pell', 'sudo useradd -m pell']]] },
  { c: 'usermod', l: 'Changes an existing user, like which groups they’re in.', fx: 'stun', w: [
    ['Add vee to the residents group without removing other groups.', ['sudo usermod -aG residents vee', 'usermod -aG residents vee']],
    ['Give juno admin rights by adding her to the sudo group.', ['sudo usermod -aG sudo juno', 'usermod -aG sudo juno']]] },
  { c: 'passwd', l: 'Changes a password.', fx: 'guard', w: [
    ['Change your own password.', ['passwd']],
    ['Reset the password for the user pell.', ['sudo passwd pell', 'passwd pell']]] },

  /* ---- level 17 ---- */
  { c: 'uname', l: 'Shows details about the system and its kernel.', fx: 'focus', w: [
    ['Which kernel version is this machine running?', ['uname -r']],
    ['Show everything uname knows about this system.', ['uname -a']]] },
  { c: 'hostname', l: 'Shows the machine’s name on the network.', fx: 'focus', w: [
    ['Which machine are you on? Print its name.', ['hostname']],
    ['Show this machine’s IP addresses the quick way.', ['hostname -I']]] },
  { c: 'uptime', l: 'Shows how long the machine has run, and how busy it is.', fx: 'heal', w: [
    ['How long since this server last rebooted?', ['uptime']],
    ['Check the load averages quickly.', ['uptime']]] },
  { c: 'which', l: 'Shows where a command’s program lives.', fx: 'crit', w: [
    ['Which python is actually being run? Find its path.', ['which python', 'which python3']],
    ['Is git installed? Find where it lives.', ['which git']]] },
  { c: 'free', l: 'Shows how much memory is used and free.', fx: 'heal', w: [
    ['Is the machine running out of memory? Check, in human-readable units.', ['free -h']],
    ['Show memory use in megabytes.', ['free -m']]] },

  /* ---- level 18 ---- */
  { c: 'ln', l: 'Makes links: a second name that points at a file.', fx: 'multi2', w: [
    ['Make a shortcut called latest that points to build-42.', ['ln -s build-42 latest']],
    ['Link /opt/app/bin/app into /usr/local/bin as app.', ['sudo ln -s /opt/app/bin/app /usr/local/bin/app', 'ln -s /opt/app/bin/app /usr/local/bin/app']]] },
  { c: 'diff', l: 'Shows the differences between two files.', fx: 'expose', w: [
    ['What changed between config.old and config.new?', ['diff config.old config.new']],
    ['Compare two folders, a and b, file by file.', ['diff -r a b']]] },
  { c: 'cut', l: 'Pulls columns out of each line.', fx: 'multi2', w: [
    ['Print only the first column of users.csv, split on commas.', ['cut -d, -f1 users.csv', "cut -d ',' -f1 users.csv", 'cut -d "," -f1 users.csv', 'cut -d, -f 1 users.csv']],
    ['List just the usernames in /etc/passwd: the first field, split on colons.', ['cut -d: -f1 /etc/passwd', "cut -d ':' -f1 /etc/passwd"]]] },

  /* ---- level 19 ---- */
  { c: 'find -exec', k: 'find', n: '-exec', l: 'Runs a command on every file find turns up.', fx: 'all', w: [
    ['Delete every .tmp file under this folder, wherever it is.', ['find . -name "*.tmp" -exec rm {} \\;', "find . -name '*.tmp' -exec rm {} \\;", 'find . -name "*.tmp" -exec rm {} +', 'find . -name "*.tmp" -delete']],
    ['Make every .sh file under scripts executable.', ['find scripts -name "*.sh" -exec chmod +x {} \\;', "find scripts -name '*.sh' -exec chmod +x {} \\;", 'find scripts -name "*.sh" -exec chmod +x {} +']]] },
  { c: 'xargs', l: 'Turns lines of input into arguments for another command.', fx: 'multi3', w: [
    ['Delete every file listed in junk.txt.', ['cat junk.txt | xargs rm', 'xargs rm < junk.txt']],
    ['Count the lines in every .log file find turns up.', ['find . -name "*.log" | xargs wc -l', "find . -name '*.log' | xargs wc -l"]]] },
  { c: 'tee', l: 'Writes output to a file and to the screen at the same time.', fx: 'multi2', w: [
    ['Show the output of ls and also save it to list.txt.', ['ls | tee list.txt']],
    ['Append a line to /etc/hosts, which needs root, using tee.', ['echo "10.0.0.5 core" | sudo tee -a /etc/hosts', "echo '10.0.0.5 core' | sudo tee -a /etc/hosts"]]] },
  { c: 'sed', l: 'Edits text as it streams past: find and replace without an editor.', fx: 'heavy', w: [
    ['Replace every “old” with “new” in notes.txt, in place.', ["sed -i 's/old/new/g' notes.txt", 'sed -i "s/old/new/g" notes.txt']],
    ['Print notes.txt with every “cat” changed to “dog”, without editing the file.', ["sed 's/cat/dog/g' notes.txt", 'sed "s/cat/dog/g" notes.txt']]] },

  /* ---- level 20 ---- */
  { c: 'awk', l: 'A small language for columns of text.', fx: 'multi3', w: [
    ['Print only the second column of data.txt.', ["awk '{print $2}' data.txt", 'awk "{print \\$2}" data.txt']],
    ['Print the first column of access.log.', ["awk '{print $1}' access.log"]]] },
  { c: 'env', l: 'Shows every environment variable.', fx: 'focus', w: [
    ['List all your environment variables.', ['env', 'printenv']],
    ['Find the PATH variable among them.', ['env | grep PATH', 'printenv PATH', 'echo $PATH']]] },
  { c: 'export', l: 'Sets an environment variable for this session and everything it starts.', fx: 'guard', w: [
    ['Set EDITOR to nano for everything you run next.', ['export EDITOR=nano']],
    ['Add /opt/bin to the front of your PATH.', ['export PATH=/opt/bin:$PATH', 'export PATH="/opt/bin:$PATH"']]] },
  { c: 'alias', l: 'Gives a long command a short name.', fx: 'focus', w: [
    ['Make ll mean ls -la.', ["alias ll='ls -la'", 'alias ll="ls -la"']],
    ['Show every alias you have set.', ['alias']]] },
  { c: 'crontab', l: 'Schedules commands to run on their own.', fx: 'slow', w: [
    ['Edit your scheduled jobs.', ['crontab -e']],
    ['List the jobs you have scheduled.', ['crontab -l']]] },

  /* ---- level 21 ---- */
  { c: 'ssh-keygen', l: 'Makes a key pair for logging in without a password.', fx: 'crit', w: [
    ['Generate a new ssh key.', ['ssh-keygen', 'ssh-keygen -t ed25519', 'ssh-keygen -t rsa']],
    ['Make a modern ed25519 key.', ['ssh-keygen -t ed25519']]] },
  { c: 'rsync', l: 'Copies only what changed. The right way to back things up.', fx: 'multi3', w: [
    ['Copy the site folder into backup, keeping permissions and dates.', ['rsync -a site/ backup/', 'rsync -av site/ backup/', 'rsync -a site backup']],
    ['Sync photos to server.local:/backup over ssh.', ['rsync -av photos server.local:/backup', 'rsync -a photos server.local:/backup', 'rsync -avz photos server.local:/backup']]] },
  { c: 'ss', l: 'Shows network connections and which ports are listening.', fx: 'expose', w: [
    ['Which ports is this machine listening on?', ['ss -tuln', 'ss -tlnp', 'ss -lt', 'ss -tulpn']],
    ['Show every open TCP connection.', ['ss -t', 'ss -ta']]] },

  /* ---- level 22 ---- */
  { c: 'dig', l: 'Asks DNS what address a name points to.', fx: 'crit', w: [
    ['What IP address does meridian.net point to?', ['dig meridian.net', 'dig +short meridian.net']],
    ['Look up the mail servers for upstream.net.', ['dig mx upstream.net', 'dig upstream.net mx', 'dig MX upstream.net']]] },
  { c: 'traceroute', l: 'Shows every hop between you and another machine.', fx: 'slow', w: [
    ['The connection to upstream.net is slow. Show every hop along the way.', ['traceroute upstream.net', 'tracepath upstream.net']],
    ['Trace the route to 8.8.8.8.', ['traceroute 8.8.8.8', 'tracepath 8.8.8.8']]] },
  { c: 'lsof', l: 'Lists open files, and which process has them open.', fx: 'expose', w: [
    ['Something is using port 80. Find out what.', ['lsof -i :80', 'sudo lsof -i :80']],
    ['Which process has app.log open?', ['lsof app.log']]] },
  { c: 'dmesg', l: 'Shows messages from the kernel: hardware, drivers, crashes.', fx: 'focus', w: [
    ['A USB drive won’t mount. Read the kernel’s messages.', ['dmesg', 'sudo dmesg', 'dmesg | tail']],
    ['Show the most recent kernel messages only.', ['dmesg | tail', 'sudo dmesg | tail']]] },

  /* ---- level 23 ---- */
  { c: 'lsblk', l: 'Lists disks and their partitions.', fx: 'focus', w: [
    ['Which disks are plugged into this machine?', ['lsblk']],
    ['Show disks along with their filesystems.', ['lsblk -f']]] },
  { c: 'mount', l: 'Attaches a disk to a folder so you can use it.', fx: 'guard', w: [
    ['Mount the partition /dev/sdb1 at /mnt/usb.', ['sudo mount /dev/sdb1 /mnt/usb', 'mount /dev/sdb1 /mnt/usb']],
    ['Show everything that is mounted right now.', ['mount', 'findmnt']]] },
  { c: 'nano', l: 'A simple text editor. Ctrl+O saves, Ctrl+X exits.', fx: 'heal', w: [
    ['Open config.txt in a simple editor.', ['nano config.txt']],
    ['Edit /etc/hosts. It needs root.', ['sudo nano /etc/hosts']]] },
  { c: 'vim', l: 'A powerful editor. To leave: Escape, then :wq to save or :q! to quit.', fx: 'heal', w: [
    ['Open notes.txt in vim.', ['vim notes.txt', 'vi notes.txt']],
    ['You are stuck in vim. Save and quit. (Type it as you would in vim.)', [':wq', ':x', 'ZZ']]] },
  { c: 'nohup', l: 'Keeps a command running after you log out.', fx: 'leak', w: [
    ['Start long_job.sh so it keeps running after you disconnect.', ['nohup ./long_job.sh &', 'nohup ./long_job.sh', 'nohup bash long_job.sh &']],
    ['Run server.py in the background, safe from logouts.', ['nohup python3 server.py &', 'nohup python server.py &']]] }
];
