<template lang="html">
  <article class="post">
    <div class="media">
      <div class="media-left">
        <p class="image is-32x32">
          <img :src="photoSrc" @error="useDefault">
        </p>
      </div>
      <div class="media-content">
        <div class="content">
          <p>
            <a href="#">{{user.username}}</a> {{ from | ago}} &nbsp;
          </p>
        </div>
      </div>
    </div>
    <h4><slot></slot></h4>
  </article>
</template>

<script>
import moment from 'moment';
var defaultAvatar = require('../defaultAvatar');

export default {
  name:'Message',
  props:['user', 'from'],
  data () {
    return { failedPhoto: false };
  },
  computed: {
    photoSrc () {
      if (this.failedPhoto || !this.user || !this.user.photo) {
        return defaultAvatar;
      }
      return this.user.photo;
    }
  },
  watch: {
    'user.photo' () {
      this.failedPhoto = false;
    }
  },
  methods: {
    useDefault () {
      this.failedPhoto = true;
    }
  },
  filters:{
    ago(date){
      if (date) {
        return moment(date).fromNow();
      }
    }
  },
}
</script>

<style lang="css">
</style>
