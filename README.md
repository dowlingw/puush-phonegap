puush universal client
======================

About the project
-----------------
This is a cross-platform mobile client application for the image sharing application, [puush](https://puush.me/).

I wrote this because the original puush client for Apple iOS hasn't been updated to work on iOS 7 and has a number of issues.Also, I wanted to write a mobile app using Cordova/Phonegap and AngularJS.

Currently this project only targets iOS, however with minimal changes it should be portable to Android, Blackberry, and a whole bunch of other mobile platforms. Hence the "universal" client name.

Getting started
---------------
To get started with this application, you will need a working Cordova/Phonegap installation - as well as any development tools for the platform you're working with. The best place for getting started here is the Cordova website.

Additionally you will need the `wkhtmltox` tools installed on your system.

Once you have your development environment set up, you will need to run the `prepare.sh` script. This will:

*    Install the required plugins
*    Render the splash screen `screen.html` at all the required sizes
*    Configure the platform configurations for the application


Special Thanks
--------------
Thanks to the following people who helped, even if they don't know it!

*    [peppy](https://github.com/peppy) - For enabling CORS support on the puush API which makes this entire idea possible (and, yknow... making and running puush for all these years)
*    [blha303](https://github.com/blha303/) - For his reverse-engineered notes on the puush API
*    [westie](https://github.com/Westie/) - For his reverse-engineered notes on the puush API

License
-------
The source code for this application is available under the MIT License. Please refer to the `LICENSE` file for the full license text.
