# >>> conda initialize >>>
# !! Contents within this block are managed by 'conda init' !!
__conda_setup="$('/Users/emmaturk/opt/anaconda3/bin/conda' 'shell.zsh' 'hook' 2> /dev/null)"
if [ $? -eq 0 ]; then
    eval "$__conda_setup"
else
    if [ -f "/Users/emmaturk/opt/anaconda3/etc/profile.d/conda.sh" ]; then
        . "/Users/emmaturk/opt/anaconda3/etc/profile.d/conda.sh"
    else
        export PATH="/Users/emmaturk/opt/anaconda3/bin:$PATH"
    fi
fi
unset __conda_setup
# <<< conda initialize <<<

# Add MySQL to PATH
export PATH="/usr/local/mysql/bin:$PATH"

# Load Angular CLI autocompletion
source <(ng completion zsh)

