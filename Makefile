include Hurley-Make/Makefile.common
include Hurley-Make/Makefile.docker
include Hurley-Make/Makefile.node

###################################################################################################
##     Building project
###################################################################################################

build: clean ## Metatarget for running build and unit test
	${INFO}"Building: $(call HLIGHT,$(ARTIFACT_NAME))"
	make npm-install
	make npm-run-script script=build
.PHONY:build