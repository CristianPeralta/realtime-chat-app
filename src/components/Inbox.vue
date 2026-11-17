<template lang="html">
	<div ref="allbox" id="live-chat">

		<header @click="minimize" class="clearfix">

			<a @click="close($event)" class="chat-close">x</a>

			<h4>{{user.user.username}}</h4>
		</header>

		<div ref="chat" class="chat">

			<div ref="history" class="chat-history">
				<slot></slot>
			</div>

				<fieldset>

					<input type="text" placeholder="Type your message…" v-model="text" autofocus @keydown.enter.prevent="addMessage">
					<input type="hidden">
					<button type="button" @click="addMessage" name="button">Send</button>
				</fieldset>

		</div>

	</div>
</template>

<script>
export default {
  data () {
    return {
      open: true,
      heightChecked: false,
      initHeight: 0,
      message: [],
      text: ''
    }
  },
  props: ['user'],
  methods: {
    scrollToLatest () {
      const history = this.$refs.history;
      if (history) {
        history.scrollTop = history.scrollHeight;
      }
    },
    addMessage () {
      this.$parent.$socket.emit('addMessagePrivated', {
        to: this.user,
        user: this.$parent.user,
        text: this.text
      });
      this.text = '';
    },
    minimize () {
      this.slideToggle(this.$refs.chat);
    },
    close (e) {
      e.preventDefault();
      this.fadeOut(this.$refs.allbox);
    },
    slideToggle(el) {
      if(!this.heightChecked) {
          this.initHeight = el.offsetHeight;
          this.heightChecked = true;
      }
      if(this.open) {
          this.open = false;
          el.style.height = '0px';
      }
      else {
          this.open = true;
          el.style.height = this.initHeight + 'px';
      }
    },
    fadeOut(el) {
        el.style.opacity = 1 / 100;
        el.style.filter = 'alpha(opacity=' + 1 + ')';
        if (1 == 1) {
            el.style.display = 'none';
        }
    }
  }
}
</script>

<style lang="css">
@import '../assets/css/imbox.css'
</style>
