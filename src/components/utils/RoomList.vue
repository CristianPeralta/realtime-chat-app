<template lang="html">
  <div class="column is-3" style="z-index:80;">
    <aside class="menu">
      <p class="menu-label">
        Channels
      </p>
      <ul class="menu-list">
        <li v-for="(room, index) in rooms" :key="index">
          <a @click="goRoom(room.slug)">{{room.name}}</a>
        </li>
      </ul>
      <p class="menu-label">
        New Room
      </p>
      <ul class="menu-list">
        <input class="input" type="text" v-model="newRoom" placeholder="New Room">
        <button @click="sendForm()" class="button is-block is-info is-fullwidth">Add</button>
        <p v-if="error" class="help is-danger">{{ error }}</p>
      </ul>
      <slot></slot>
    </aside>
  </div>
</template>

<script>
import ChatServices from '@/services/ChatServices'

export default {
  name: 'RoomList',
  data () {
    return {
      newRoom: '',
      rooms: [],
      error: ''
    }
  },
  created () {
    this.getRooms();
  },

  methods: {
    sendForm () {
      this.error = '';
      var name = (this.newRoom || '').trim();
      if (name.length > 40) {
        this.error = 'Room names must be 1 to 40 characters';
        return;
      }
      ChatServices.addRoom({
        name: this.newRoom
      }).then((response) => {
          this.rememberRoom(response.data);
          this.newRoom = '';
          this.goRoom(response.data.slug);
      }).catch((err) => {
          var data = err.response && err.response.data;
          this.error = (data && data.error) || 'Could not create the room';
      })
    },
    getRooms () {
      ChatServices.getRooms().then((response) => {
          this.rooms = response.data;
      })
    },
    goRoom( room ){
      this.$router.push({name: 'Room', params: {initialRoom: room}});
    },
    rememberRoom (room) {
      if (!room || this.rooms.some((item) => item._id === room._id)) {
        return;
      }
      this.rooms.push(room);
    }
  },
  sockets: {
    roomAdded (room) {
      this.rememberRoom(room);
    }
  }
}
</script>

<style lang="css">
</style>
