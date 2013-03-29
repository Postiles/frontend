#!/bin/bash

for name in dhost dport fayeLocation wrapper error_log staticResource \
	dynamicResource uploadsResource cssResource imageResource \
	getGlobalKeyHandler init logError load router_map \
	getGlobalKeyHandler;
do find -name "*.js" | xargs grep "postile\.$name\>" -n --color=yes;
done

find -name "*.js" | xargs grep "postile\.conf\." -n --color=yes | sort
