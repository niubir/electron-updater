package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/Masterminds/semver"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gopkg.in/yaml.v3"
)

const (
	default_port            = 10000
	default_base_path       = "update"
	default_latest_yml_path = "./static/latest.yml"
)

var (
	config  Config
	latests = map[string]map[string]Latest{}
)

type (
	Config struct {
		Port     int    `yaml:"port" json:"port"`
		BasePath string `yaml:"basePath" json:"basePath"`
	}
	Latest struct {
		Version            string       `yaml:"version" json:"version"`
		ForceUpdateVersion string       `yaml:"forceUpdateVersion" json:"forceUpdateVersion"`
		Path               string       `yaml:"path" json:"path"`
		Sha512             string       `yaml:"sha512" json:"sha512"`
		ReleaseDate        string       `yaml:"releaseDate" json:"releaseDate"`
		Files              []LatestFile `yaml:"files" json:"files"`
	}
	LatestFile struct {
		URL    string `yaml:"url" json:"url"`
		Sha512 string `yaml:"sha512" json:"sha512"`
		Size   int64  `yaml:"size" json:"size"`
	}
	LatestProcessed struct {
		Version            string       `yaml:"version" json:"version"`
		ForceUpdateVersion string       `yaml:"forceUpdateVersion" json:"forceUpdateVersion"`
		IsLatest           bool         `yaml:"isLatest" json:"isLatest"`
		IsForce            bool         `yaml:"isForce" json:"isForce"`
		Path               string       `yaml:"path" json:"path"`
		Sha512             string       `yaml:"sha512" json:"sha512"`
		ReleaseDate        string       `yaml:"releaseDate" json:"releaseDate"`
		Files              []LatestFile `yaml:"files" json:"files"`
	}
	getLatestParam struct {
		Platform string `header:"platform" binding:"required"`
		Arch     string `header:"arch" binding:"required"`
		Version  string `header:"version" binding:"required"`
	}
)

func init() {
	loadConfig()
	if err := loadLatestFile(); err != nil {
		log.Println("load latest.yml failed:", err)
	}
}

func main() {
	// gin.SetMode("release")

	engine := gin.Default()
	engine.Use(newCors())

	base := engine.Group(config.BasePath)
	base.PUT("/latest.yml", updateLatest)
	base.GET("/*path", parseUpdatePath)

	if err := engine.Run(fmt.Sprintf(":%d", config.Port)); err != nil {
		panic(err)
	}
}

func updateLatest(c *gin.Context) {
	if err := loadLatestFile(); err != nil {
		c.YAML(http.StatusBadRequest, gin.H{
			"error":   "Load latest file failed",
			"message": err.Error(),
		})
		return
	}
	c.YAML(http.StatusOK, nil)
}

func parseUpdatePath(c *gin.Context) {
	var uri struct {
		Path string `uri:"path" binding:"required"`
	}
	if err := c.BindUri(&uri); err != nil {
		c.YAML(http.StatusBadRequest, gin.H{
			"error":   "Bind path failed",
			"message": err.Error(),
		})
		return
	}
	uri.Path = strings.TrimPrefix(uri.Path, "/")
	switch uri.Path {
	case "latest.yml":
		latest(c)
	default:
		download(c, uri.Path)
	}
}

func latest(c *gin.Context) {
	var param getLatestParam
	if err := c.BindHeader(&param); err != nil {
		c.YAML(http.StatusBadRequest, gin.H{
			"error":   "Bind header failed",
			"message": err.Error(),
		})
		return
	}

	latest, err := getLatestProcessed(param)
	if err != nil {
		c.YAML(http.StatusBadRequest, gin.H{
			"error":   "Get latest failed",
			"message": err.Error(),
		})
		return
	}

	c.YAML(http.StatusOK, latest)
}

func download(c *gin.Context, filePath string) {
	c.File(filepath.Join("./static", filePath))
}

func getLatestProcessed(param getLatestParam) (*LatestProcessed, error) {
	latest, ok := latests[param.Platform][param.Arch]
	if !ok {
		return nil, fmt.Errorf("latest not found for platform(%s) arch(%s)", param.Platform, param.Arch)
	}

	if latest.ForceUpdateVersion == "" {
		latest.ForceUpdateVersion = "0.0.0"
	}

	processed := &LatestProcessed{
		Version:            latest.Version,
		ForceUpdateVersion: latest.ForceUpdateVersion,
		Path:               latest.Path,
		Sha512:             latest.Sha512,
		ReleaseDate:        latest.ReleaseDate,
		Files:              latest.Files,
	}

	paramVersion, err := semver.NewVersion(param.Version)
	if err != nil {
		return nil, fmt.Errorf("param version (%s) is non standard", param.Version)
	}
	latestVersion, err := semver.NewVersion(latest.Version)
	if err != nil {
		return nil, fmt.Errorf("latest version (%s) is non standard", latest.Version)
	}
	latestForceUpdateVersion, err := semver.NewVersion(latest.ForceUpdateVersion)
	if err != nil {
		return nil, fmt.Errorf("latest force update version (%s) is non standard", latest.ForceUpdateVersion)
	}

	// set IsLatest
	if paramVersion.Compare(latestVersion) >= 0 {
		processed.IsLatest = true
	}
	// set IsForce
	if !processed.IsLatest && paramVersion.Compare(latestForceUpdateVersion) <= 0 {
		processed.IsForce = true
	}
	return processed, nil
}

func loadConfig() {
	if tmp, err := strconv.Atoi(os.Getenv("ELECTRON_UPDATER_SERVER_PORT")); err == nil && tmp > 0 {
		config.Port = tmp
	} else {
		config.Port = default_port
	}
	if tmp := strings.TrimSpace(os.Getenv("ELECTRON_UPDATER_SERVER_BASE_PATH")); tmp != "" {
		config.BasePath = tmp
	} else {
		config.BasePath = default_base_path
	}
}

func loadLatestFile() error {
	var latest_yml_path = default_latest_yml_path
	if tmp := strings.TrimSpace(os.Getenv("ELECTRON_UPDATER_RESOURCE_PATH")); tmp != "" {
		latest_yml_path = tmp
	}
	body, err := ioutil.ReadFile(latest_yml_path)
	if err != nil {
		return err
	}
	return yaml.Unmarshal(body, &latests)
}

func newCors() gin.HandlerFunc {
	return cors.New(cors.Config{
		//准许跨域请求网站,多个使用,分开,限制使用*
		AllowOrigins: []string{"*"},
		//准许使用的请求方式
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "PATCH"},
		//准许使用的请求表头
		AllowHeaders: []string{"Origin", "Authorization", "Content-Type", "Platform", "Arch", "Version"},
		//显示的请求表头
		ExposeHeaders: []string{"Content-Type"},
		//凭证共享,确定共享
		AllowCredentials: true,
		//容许跨域的原点网站,可以直接return true就万事大吉了
		AllowOriginFunc: func(origin string) bool {
			return true
		},
		//超时时间设定
		MaxAge: 24 * time.Hour,
	})
}
