CONF_DIR=conf_files
SERVICE=tunnel-agent.service
TIMER=tunnel-agent.timer

install:
	sudo cp $(CONF_DIR)/$(SERVICE) /etc/systemd/system/
	sudo cp $(CONF_DIR)/$(TIMER) /etc/systemd/system/
	sudo systemctl daemon-reload
	sudo systemctl enable --now $(TIMER)

status:
	-sudo systemctl status $(TIMER)
	-sudo systemctl status $(SERVICE)

logs:
	sudo journalctl -u $(SERVICE) -n 100 --no-pager

uninstall:
	sudo systemctl disable --now $(TIMER)
	sudo rm -f /etc/systemd/system/$(TIMER) /etc/systemd/system/$(SERVICE)
	sudo systemctl daemon-reload
